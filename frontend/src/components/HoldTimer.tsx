import React from 'react';import {Clock3,ArrowRight,Trash2,ShieldCheck} from 'lucide-react';import {useCountdown} from '../hooks/useCountdown';
interface Props {expiresAt:string|null;heldCount:number;totalPrice?:number;onExpire:()=>void;onRelease:()=>void;onCheckout:()=>void;}
export function HoldTimer({expiresAt,heldCount,totalPrice=0,onExpire,onRelease,onCheckout}:Props){
 const {formatted,isUrgent,isExpired}=useCountdown(expiresAt,onExpire);
 if(!expiresAt||heldCount===0||isExpired)return null;
 return <div className="hold-tray"><div className="hold-panel"><div className="hold-clock"><Clock3 size={22}/><div><strong className={isUrgent?'hold-urgent':''}>{formatted}</strong><small>RESERVATION TIME LEFT</small></div></div><div className="hold-summary"><strong>{heldCount} {heldCount===1?'seat':'seats'} selected</strong><span>Demo total from ${totalPrice.toFixed(2)} + fees</span></div><button onClick={onRelease} className="hold-release" aria-label="Release selected seats"><Trash2 size={18}/></button><button className="btn btn-coral hold-checkout" onClick={onCheckout}>Continue to checkout <ArrowRight size={17}/></button></div></div>;
}
