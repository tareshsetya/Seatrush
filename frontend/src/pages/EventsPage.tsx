import React,{useEffect,useMemo,useState} from 'react';
import {ArrowRight,ArrowUpRight,CalendarDays,MapPin,Search,Music2,Clapperboard,Trophy,PartyPopper,Ticket,MoveUpRight,ExternalLink,Wifi,AlertCircle} from 'lucide-react';
import {Event,DiscoveryItem,DiscoveryMeta} from '../types';import {api} from '../services/api';import {EventCard} from '../components/EventCard';
interface Props {events:Event[];onSelectEvent:(event:Event)=>void;isLoading:boolean;selectedCity:string;onCityClick:()=>void;}
const CATS=[{id:'all',title:'Everything',icon:PartyPopper},{id:'events',title:'Live events',icon:Music2},{id:'movies',title:'Movies',icon:Clapperboard}];
export function EventsPage({events,onSelectEvent,isLoading,selectedCity,onCityClick}:Props){
 const [category,setCategory]=useState<'all'|'events'|'movies'>('all');const [q,setQ]=useState('');const [query,setQuery]=useState('');
 const [discoveries,setDiscoveries]=useState<DiscoveryItem[]>([]);const [meta,setMeta]=useState<DiscoveryMeta|null>(null);const [loading,setLoading]=useState(false);const [error,setError]=useState('');
 useEffect(()=>{const t=setTimeout(()=>setQuery(q.trim()),350);return()=>clearTimeout(t)},[q]);
 useEffect(()=>{let cancelled=false;setLoading(true);setError('');
   api.discover(selectedCity,query,category).then(r=>{if(!cancelled){setDiscoveries(r.data);setMeta(r.meta);}})
    .catch(e=>{if(!cancelled){setError(e.message);setDiscoveries([]);}}).finally(()=>{if(!cancelled)setLoading(false)});
   return()=>{cancelled=true};
 },[selectedCity,query,category]);
 const highlight=events[0];
 const demoEvents=useMemo(()=>events.filter(e=>category!=='movies'||e.category==='Movies').filter(e=>!query||[e.title,e.artist,e.venue,e.category].join(' ').toLowerCase().includes(query.toLowerCase())).slice(0,6),[events,category,query]);
 return <main className="explore-page">
  <div className="site-shell"><div className="welcome-row"><span className="eyebrow"><span className="live-indicator"/> ENTERTAINMENT, CURATED FOR YOU</span><span className="welcome-right">Good plans are made here.</span></div>
   <section className="hero-banner"><div className="hero-art" style={{backgroundImage:`linear-gradient(90deg, #121c2c 2%, rgba(18,28,44,.90) 32%, rgba(18,28,44,.16) 100%),url('${highlight?.bannerUrl||''}')`}}/>
    <div className="hero-copy"><span className="hero-kicker"><span/> THE CITY IS CALLING</span><h1>Make room for<br/><em>memorable.</em></h1><p>Unmissable gigs, big-screen moments and new experiences. Your next story starts here.</p>
     <button className="btn btn-coral hero-cta" onClick={()=>document.getElementById('discover-section')?.scrollIntoView({behavior:'smooth'})}>Find your next plan <ArrowRight size={19}/></button>
    </div><span className="hero-side-note">SEATRUSH / GO OUT MORE</span>
   </section>
   <div className="search-row"><div className="search-field"><Search size={20}/><input aria-label="Search events and movies" placeholder="Search concerts, movies, artists, things to do…" value={q} onChange={e=>setQ(e.target.value)}/>{q&&<button onClick={()=>setQ('')} className="search-clear">Clear</button>}</div>
    <button className="city-search-btn" onClick={onCityClick}><MapPin size={18}/><span>{selectedCity}</span><span className="city-change">Change</span></button></div>
   <div className="category-strip" role="tablist" aria-label="Experience type">{CATS.map(c=><button role="tab" aria-selected={category===c.id} key={c.id} onClick={()=>setCategory(c.id as typeof category)} className={category===c.id?'category-active':''}><c.icon size={19}/>{c.title}</button>)}</div>
   <section className="discover-section" id="discover-section"><div className="section-heading"><div><div className="section-eyebrow">YOUR CITY, YOUR SCENE</div><h2>Happening around <span>{selectedCity}</span></h2><p>Fresh listings from event and movie discovery partners.</p></div><span className="section-pill"><Wifi size={15}/> Provider listings</span></div>
    {error&&<div className="provider-notice warn"><AlertCircle size={18}/>{error}</div>}
    {loading?<div className="external-grid">{Array.from({length:4}).map((_,i)=><div key={i} className="external-skeleton"/>)}</div>:
      discoveries.length>0?<div className="external-grid">{discoveries.map(item=><ExternalCard item={item} key={item.id}/>)}</div>:
       <div className="discover-empty"><div className="discover-empty-icon"><Search size={27}/></div><h3>{!meta?.providers.ticketmaster&&!meta?.providers.tmdb?'Discover more with live event APIs':'No listings found for this search'}</h3><p>{!meta?.providers.ticketmaster&&!meta?.providers.tmdb?'Connect Ticketmaster and/or TMDB keys in backend/.env to display live discovery results.':'Try another category or city. Provider coverage and availability vary by location.'}</p><button className="btn btn-outline" onClick={()=>{setQ('');setCategory('all')}}>Browse all categories</button></div>}
    {!!meta?.warnings.length&&<p className="provider-warning">{meta.warnings.join(' · ')}</p>}
    <p className="source-note">External events link to the original provider. Movie listings are not live cinema showtimes or SeatRush inventory. {meta?.providers.tmdb&&'Movie data © TMDB (not endorsed by TMDB).'}</p>
   </section>
   <section className="demo-section"><div className="section-heading"><div><div className="section-eyebrow">EXPLORE THE BOOKING ENGINE</div><h2>Take SeatRush for a spin</h2><p>Sample international events with real-time demo seat reservations. No charges are made.</p></div><span className="demo-pill"><Ticket size={15}/> DEMO INVENTORY</span></div>
    {isLoading?<div className="demo-grid">{[1,2,3].map(i=><div key={i} className="external-skeleton"/>)}</div>:
      demoEvents.length?<div className="demo-grid">{demoEvents.map(e=><EventCard key={e.id} event={e} onSelect={onSelectEvent}/>)}</div>:<p className="empty-note">No demo events match your search. Try clearing the filter.</p>}
   </section>
   <section className="promo-band"><div><span className="eyebrow light">WHY SEATRUSH</span><h2>For the moments<br/>you'll talk about later.</h2><p>Seat reservations held by PostgreSQL, live updates, and a checkout experience built for clarity.</p></div><div className="promo-stat"><strong>10:00</strong><span>MINUTE DEMO SEAT HOLD</span></div></section>
  </div>
 </main>;
}
function ExternalCard({item}:{item:DiscoveryItem}){
 const date=item.date?new Date(`${item.date}T12:00:00`).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}):'Date TBA';
 return <a className="external-card" href={item.url} target="_blank" rel="noopener noreferrer" aria-label={`View ${item.title} on ${item.source}`}>
   <div className="external-image">{item.image?<img loading="lazy" src={item.image} alt=""/>:<div className="image-placeholder"><Ticket size={30}/></div>}
    <span className="external-source">{item.source==='tmdb'?'TMDB · FILM':'TICKETMASTER · EVENT'}</span>
   </div><div className="external-copy"><div className="external-date"><CalendarDays size={14}/>{date}</div><h3>{item.title}</h3><p><MapPin size={14}/>{item.venue} · {item.city}</p><div className="external-link">View on {item.source==='tmdb'?'TMDB':'Ticketmaster'} <ArrowUpRight size={17}/></div></div>
 </a>;
}
