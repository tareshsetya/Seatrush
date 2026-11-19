import React,{useRef,useState} from 'react';
import {Seat,Event,Booking} from '../types';import {api} from '../services/api';
import {X,LockKeyhole,ShieldCheck,ArrowRight,Info} from 'lucide-react';
interface Props {isOpen:boolean;onClose:()=>void;event:Event;heldSeats:Seat[];userId:string;expiresAt:string|null;onBookingSuccess:(b:Booking,replay:boolean)=>void;}
export function CheckoutModal({isOpen,onClose,event,heldSeats,onBookingSuccess}:Props){
 const key=useRef(`demo-${crypto.randomUUID()}`);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 if(!isOpen||!heldSeats.length)return null;
 const subtotal=heldSeats.reduce((s,x)=>s+x.price,0);const fee=Math.round(subtotal*.08);
 const confirm=async()=>{setBusy(true);setError('');try{const result=await api.createBooking({eventId:event.id,seatIds:heldSeats.map(s=>s.id),idempotencyKey:key.current});onBookingSuccess(result.booking,result.isReplay);}catch(e:any){setError(e.message||'Booking failed');}finally{setBusy(false)}};
 return <div className="checkout-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><div className="checkout-card" role="dialog" aria-modal="true" aria-label="Demo checkout">
  <div className="checkout-top"><div><span className="eyebrow">SEATRUSH CHECKOUT</span><h2>Your seats, almost yours.</h2><p>Review your reservation before confirming.</p></div><button className="icon-btn" onClick={onClose} aria-label="Close"><X size={21}/></button></div>
  <div className="checkout-event"><img src={event.bannerUrl} alt=""/><div><strong>{event.title}</strong><p>{event.venue} · {event.date}</p></div></div>
  <div className="checkout-label">RESERVED SEATS</div><div className="checkout-seats">{heldSeats.map(s=><div key={s.id}><strong>{s.label}</strong><small>{s.tier}</small></div>)}</div>
  <div className="checkout-totals"><div><span>Tickets ({heldSeats.length})</span><strong>${subtotal.toFixed(2)}</strong></div><div><span>Demo booking fee (8%)</span><strong>${fee.toFixed(2)}</strong></div><div className="checkout-grand"><span>Demo total</span><strong>${(subtotal+fee).toFixed(2)}</strong></div></div>
  <div className="demo-alert"><Info size={19}/><p><strong>This is a demo checkout.</strong> No card is required and no payment is charged. A ticket will be generated only for this demo event.</p></div>
  {error&&<p className="inline-error" role="alert">{error}</p>}
  <button className="btn btn-coral checkout-submit" onClick={confirm} disabled={busy}><LockKeyhole size={18}/>{busy?'Confirming your seats…':'Confirm demo booking'}<ArrowRight size={18}/></button>
  <p className="checkout-note"><ShieldCheck size={16}/> PostgreSQL verifies that the seat hold belongs to your account.</p>
 </div></div>;
}
