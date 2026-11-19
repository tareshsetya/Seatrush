import React,{useEffect,useState} from 'react';
import {Event,Seat,Booking} from '../types';import {api} from '../services/api';import {socketClient} from '../services/socket';
import {SeatMap} from '../components/SeatMap';import {HoldTimer} from '../components/HoldTimer';import {CheckoutModal} from '../components/CheckoutModal';
import {ArrowLeft,CalendarDays,MapPin,RotateCw,ShieldCheck,AlertCircle} from 'lucide-react';
interface Props {event:Event;userId:string;onBack:()=>void;onBookingSuccess:(b:Booking,replay:boolean)=>void;}
export function EventBookingPage({event,userId,onBack,onBookingSuccess}:Props){
 const [seats,setSeats]=useState<Seat[]>([]);const [loading,setLoading]=useState(true);const [pending,setPending]=useState<string|null>(null);const [error,setError]=useState('');const [checkout,setCheckout]=useState(false);
 const mine=seats.filter(s=>s.status==='HELD'&&s.heldBy===userId);const earliest=mine.map(s=>s.heldUntil).filter((s):s is string=>!!s).sort()[0]||null;
 const refresh=async()=>{try{setSeats(await api.getSeats(event.id));setError('');}catch(e:any){setError(e.message||'Failed to load seats.')}finally{setLoading(false)}};
 useEffect(()=>{void refresh();socketClient.joinEvent(event.id);const socket=socketClient.getSocket();
  const onUpdate=(payload:{eventId:string;updatedSeats:Seat[]})=>{if(payload.eventId!==event.id)return;
    setSeats(old=>{const updates=new Map(payload.updatedSeats.map(s=>[s.id,s]));return old.map(prev=>{const next=updates.get(prev.id);if(!next)return prev;
      // The event broadcast never contains another shopper's identity; preserve our valid hold only when its deadline matches.
      const own=next.status==='HELD'&&prev.heldBy===userId&&next.heldUntil===prev.heldUntil;
      return {...next,heldBy:own?userId:next.heldBy};
    });});};
  socket.on('SEATS_UPDATED',onUpdate);socket.on('connect',refresh);
  return()=>{socketClient.leaveEvent(event.id);socket.off('SEATS_UPDATED',onUpdate);socket.off('connect',refresh);};
 },[event.id,userId]);
 const choose=async(seat:Seat)=>{setError('');setPending(seat.id);
  try{if(seat.status==='HELD'&&seat.heldBy===userId){const data=await api.releaseSeats(event.id,[seat.id]);setSeats(prev=>prev.map(s=>data.find(x=>x.id===s.id)||s));}
      else if(seat.status==='AVAILABLE'){if(mine.length>=8){setError('You can reserve up to eight seats per booking.');return;}
        const data=await api.holdSeats(event.id,[seat.id]);setSeats(prev=>prev.map(s=>data.heldSeats.find(x=>x.id===s.id)||s));}
  }catch(e:any){await refresh();setError(e.message||'This seat is no longer available.');}finally{setPending(null);}
 };
 const release=async()=>{if(!mine.length)return;try{const data=await api.releaseSeats(event.id,mine.map(s=>s.id));setSeats(prev=>prev.map(s=>data.find(x=>x.id===s.id)||s));}catch(e:any){setError(e.message);}};
 return <main className="booking-journey site-shell"><div className="journey-nav"><button className="text-back" onClick={onBack}><ArrowLeft size={17}/> Back to events</button><span>SELECT SEATS <b>→</b> DEMO CHECKOUT <b>→</b> CONFIRMATION</span></div>
  <section className="journey-event"><img src={event.bannerUrl} alt=""/><div><span className="eyebrow">SEATRUSH DEMO EXPERIENCE</span><h1>{event.title}</h1><p><CalendarDays size={16}/>{event.date} · {event.time}</p><p><MapPin size={16}/>{event.venue}, {event.location}</p></div><button className="btn btn-outline" onClick={refresh}><RotateCw size={16}/> Refresh</button></section>
  {error&&<div className="inline-error journey-error" role="alert"><AlertCircle size={18}/>{error}<button onClick={()=>setError('')} aria-label="Dismiss error">×</button></div>}
  {loading?<div className="empty-panel">Loading the live seating plan…</div>:<SeatMap seats={seats} userId={userId} onSeatClick={choose} loadingSeatId={pending}/>}
  <div className="journey-trust"><ShieldCheck size={19}/><span>Seat ownership verified by PostgreSQL. This event and checkout are demos, with no real charges.</span></div>
  <HoldTimer expiresAt={earliest} heldCount={mine.length} totalPrice={mine.reduce((sum,s)=>sum+s.price,0)} onExpire={()=>{setError('Your seat hold expired. Please select seats again.');void refresh();}} onRelease={release} onCheckout={()=>setCheckout(true)}/>
  <CheckoutModal isOpen={checkout} onClose={()=>setCheckout(false)} event={event} heldSeats={mine} userId={userId} expiresAt={earliest} onBookingSuccess={(b,replay)=>{setCheckout(false);onBookingSuccess(b,replay);}}/>
 </main>;
}
