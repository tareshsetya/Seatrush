import React from 'react';
import {ArrowUpRight,ChevronDown,Ticket,UserRound,LayoutDashboard,Search,LogOut} from 'lucide-react';
import {UserProfile} from '../types';
interface Props {tab:string;onNavigate:(tab:string)=>void;city:string;onCityClick:()=>void;user:UserProfile|null;onLogout:()=>void;}
export function Navbar({tab,onNavigate,city,onCityClick,user,onLogout}:Props){
 return <header className="main-header"><div className="site-shell header-inner">
   <button className="brand" onClick={()=>onNavigate('events')} aria-label="SeatRush home"><span className="brand-symbol"><Ticket size={20} strokeWidth={2.6}/></span><span>seat<span className="brand-accent">rush</span><b className="brand-dot">.</b></span></button>
   <button onClick={onCityClick} className="nav-city"><span className="nav-city-label">YOUR CITY</span><strong>{city}</strong><ChevronDown size={15}/></button>
   <nav className="primary-nav" aria-label="Main navigation"><button className={tab==='events'?'nav-selected':''} onClick={()=>onNavigate('events')}>Discover</button>
     {user&&<button className={tab==='profile'?'nav-selected':''} onClick={()=>onNavigate('profile')}>My tickets</button>}
     {user?.role==='ADMIN'&&<button className={tab==='admin'?'nav-selected':''} onClick={()=>onNavigate('admin')}><LayoutDashboard size={15}/> Admin</button>}
   </nav>
   <div className="nav-actions">{user?<><button className="account-btn" onClick={()=>onNavigate('profile')}><UserRound size={17}/><span>{user.name.split(' ')[0]}</span></button><button className="icon-btn logout-icon" title="Sign out" onClick={onLogout}><LogOut size={17}/></button></>:<button className="btn btn-dark" onClick={()=>onNavigate('login')}>Sign in <ArrowUpRight size={16}/></button>}</div>
 </div></header>;
}
