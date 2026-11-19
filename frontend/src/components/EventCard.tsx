import React from 'react';
import {CalendarDays,MapPin,ArrowUpRight,ArrowRight,Ticket} from 'lucide-react';
import {Event} from '../types';
const dateLabel=(x:string)=>{try{return new Date(`${x}T12:00:00`).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});}catch{return x;}};
export function EventCard({event,onSelect}:{event:Event;onSelect:(e:Event)=>void}){
 return <article className="experience-card">
   <button className="experience-image" onClick={()=>onSelect(event)} aria-label={`Explore ${event.title}`}><img src={event.bannerUrl} alt="" loading="lazy"/><span className="event-category-chip">{event.category}</span></button>
   <div className="experience-content"><div className="experience-metadata"><CalendarDays size={15}/>{dateLabel(event.date)}<span>•</span>{event.time}</div>
     <button className="experience-title" onClick={()=>onSelect(event)}>{event.title}</button><p className="experience-venue"><MapPin size={15}/>{event.venue} · {event.location}</p>
     <div className="experience-bottom"><div><small>DEMO SEATS FROM</small><strong>${event.pricing.STANDARD.toLocaleString('en-US')}</strong></div><button className="round-arrow" onClick={()=>onSelect(event)} aria-label={`Select seats for ${event.title}`}><ArrowUpRight size={20}/></button></div>
   </div>
 </article>;
}
