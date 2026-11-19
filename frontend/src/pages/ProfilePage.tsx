import React,{useEffect,useState} from 'react';
import {Calendar,Ticket,UserRound,LogOut,ArrowLeft,ShieldCheck,MapPin} from 'lucide-react';
import {UserProfile,Booking} from '../types';import {api} from '../services/api';
export function ProfilePage({user,onLogout,onBack}:{user:UserProfile;onLogout:()=>void;onBack:()=>void}){
 const [bookings,setBookings]=useState<Booking[]>([]);const [error,setError]=useState('');const [loading,setLoading]=useState(true);
 useEffect(()=>{api.getUserBookings().then(setBookings).catch(e=>setError(e.message)).finally(()=>setLoading(false));},[user.id]);
 return <main className="site-shell profile-page"><button className="text-back" onClick={onBack}><ArrowLeft size={17}/> Keep exploring</button>
 <div className="section-eyebrow">YOUR SEATRUSH ACCOUNT</div><div className="profile-header"><div className="profile-avatar"><UserRound size={32}/></div><div><h1>Hi, {user.name.split(' ')[0]}.</h1><p>{user.email} · Member since {new Date(user.joinedDate).toLocaleDateString('en-IN',{month:'short',year:'numeric'})}</p></div><button className="btn btn-outline" onClick={onLogout}><LogOut size={17}/> Sign out</button></div>
 <div className="profile-section-heading"><div><h2>Your tickets</h2><p>Bookings made through the SeatRush demo booking engine.</p></div><span className="subtle-chip">{bookings.length} booking{bookings.length!==1?'s':''}</span></div>
 {loading?<div className="empty-panel">Loading your tickets…</div>:error?<div className="empty-panel inline-error">{error}</div>:bookings.length===0?<div className="empty-panel"><Ticket size={36}/><h3>No tickets yet</h3><p>You've got a whole city of plans ahead. Reserve your first demo ticket.</p><button className="btn btn-dark" onClick={onBack}>Explore events</button></div>:<div className="tickets-list">{bookings.map(b=><article className="my-ticket" key={b.id}><div className="ticket-date"><Calendar size={19}/><strong>{new Date(`${b.eventDate}T12:00:00`).toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}</strong></div><div><h3>{b.eventTitle}</h3><p><MapPin size={14}/>{b.venue} · {b.seats.map(s=>s.label).join(', ')}</p><small>Reference {b.referenceNumber}</small></div><span className="booked-chip"><ShieldCheck size={15}/>{b.status} · DEMO</span></article>)}</div>}
 </main>;
}
