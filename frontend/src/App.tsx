import React,{useEffect,useState} from 'react';
import {Event,Booking,UserProfile} from './types';import {api} from './services/api';
import {Navbar} from './components/Navbar';import {Footer} from './components/Footer';import {CityPicker} from './components/CityPicker';
import {EventsPage} from './pages/EventsPage';import {EventBookingPage} from './pages/EventBookingPage';
import {TicketReceipt} from './components/TicketReceipt';import {LoginPage} from './pages/LoginPage';import {ProfilePage} from './pages/ProfilePage';
import {AdminDashboardPage} from './pages/AdminDashboardPage';
export default function App(){
 const [user,setUser]=useState<UserProfile|null>(null);const [authReady,setAuthReady]=useState(false);
 const [tab,setTab]=useState<'events'|'login'|'profile'|'admin'>('events');
 const [city,setCity]=useState(()=>localStorage.getItem('sr_city')||'Delhi-NCR');
 const [cityOpen,setCityOpen]=useState(()=>!localStorage.getItem('sr_city'));
 const [events,setEvents]=useState<Event[]>([]);const [loading,setLoading]=useState(true);
 const [selectedEvent,setSelectedEvent]=useState<Event|null>(null);
 const [receipt,setReceipt]=useState<{booking:Booking;isReplay:boolean}|null>(null);
 useEffect(()=>{api.me().then(setUser).catch(()=>{}).finally(()=>setAuthReady(true));
  api.getEvents().then(setEvents).catch(console.error).finally(()=>setLoading(false));},[]);
 const changeTab=(next:string)=>{setSelectedEvent(null);setReceipt(null);setTab(next as typeof tab);window.scrollTo({top:0,behavior:'smooth'});};
 const logout=async()=>{try{await api.logout();}catch(e){console.error(e);}finally{setUser(null);changeTab('events');}};
 const selectEvent=(event:Event)=>{setSelectedEvent(event);setReceipt(null);if(!user)setTab('login');else setTab('events');window.scrollTo({top:0,behavior:'smooth'});};
 const chooseCity=(next:string)=>{setCity(next);localStorage.setItem('sr_city',next);setCityOpen(false);};
 return <div className="app-root"><Navbar tab={tab} onNavigate={changeTab} city={city} onCityClick={()=>setCityOpen(true)} user={user} onLogout={logout}/>
  <div className="app-main">
   {!authReady?<div className="site-shell startup-note">Getting SeatRush ready…</div>:
   tab==='login'?<LoginPage onBack={()=>changeTab('events')} onLoginSuccess={next=>{setUser(next);setTab('events');}}/>:
   tab==='profile'&&user?<ProfilePage user={user} onBack={()=>changeTab('events')} onLogout={logout}/>:
   tab==='admin'&&user?.role==='ADMIN'?<AdminDashboardPage/>:
   receipt?<TicketReceipt booking={receipt.booking} isReplay={receipt.isReplay} onBackToEvents={()=>{setReceipt(null);setSelectedEvent(null);api.getEvents().then(setEvents).catch(console.error);}}/>:
   selectedEvent&&user?<EventBookingPage event={selectedEvent} userId={user.id} onBack={()=>{setSelectedEvent(null);api.getEvents().then(setEvents).catch(console.error)}} onBookingSuccess={(booking,isReplay)=>{setReceipt({booking,isReplay});setSelectedEvent(null);api.getEvents().then(setEvents).catch(console.error);}}/>:
   <EventsPage events={events} onSelectEvent={selectEvent} isLoading={loading} selectedCity={city} onCityClick={()=>setCityOpen(true)}/>}
  </div><Footer/><CityPicker open={cityOpen} onSelect={chooseCity} onClose={localStorage.getItem('sr_city')?()=>setCityOpen(false):undefined}/>
 </div>;
}
