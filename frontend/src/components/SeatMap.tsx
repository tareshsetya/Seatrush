import React from 'react';
import {Seat,SeatTier} from '../types';import {Armchair,Info} from 'lucide-react';
interface Props {seats:Seat[];userId:string;onSeatClick:(seat:Seat)=>void;loadingSeatId:string|null;}
export function SeatMap({seats,userId,onSeatClick,loadingSeatId}:Props){
 const rows=new Map<string,Seat[]>();seats.forEach(s=>{const r=rows.get(s.row)||[];r.push(s);rows.set(s.row,r)});
 const sorted=[...rows.entries()].sort(([a],[b])=>a.localeCompare(b));
 return <section className="seat-layout"><div className="seat-layout-head"><div><span className="eyebrow">PICK YOUR SPOT</span><h2>Choose your seats</h2><p>Select up to eight available seats. Your reservation lasts ten minutes.</p></div><div className="seat-available"><span/>{seats.filter(s=>s.status==='AVAILABLE').length} available</div></div>
 <div className="seat-plan"><div className="seat-plan-scroll"><div className="seat-stage"><span>STAGE / SCREEN</span></div><p className="stage-hint">All seats face the stage</p>
 <div className="seat-rows">{sorted.map(([letter,seatRow])=><div className="seat-row" key={letter}><strong className="seat-row-label">{letter}</strong><div className="seat-row-items">{[...seatRow].sort((a,b)=>a.col-b.col).map((s,i)=>{
 const mine=s.status==='HELD'&&s.heldBy===userId;const disabled=s.status==='BOOKED'||(s.status==='HELD'&&!mine)||!!loadingSeatId;
 return <React.Fragment key={s.id}>{i===6&&<span className="seat-aisle" aria-hidden="true"/>}<button title={`${s.label}: ${mine?'Reserved by you':s.status.toLowerCase()} · ${s.tier} · $${s.price}`} aria-label={`Seat ${s.label}: ${mine?'reserved by you':s.status.toLowerCase()}`} disabled={disabled} onClick={()=>onSeatClick(s)} className={`seat-square ${mine?'seat-mine':s.status==='BOOKED'?'seat-booked':s.status==='HELD'?'seat-held':`seat-${s.tier.toLowerCase()}`}`}>{loadingSeatId===s.id?'…':s.col}</button></React.Fragment>;
 })}</div><strong className="seat-row-label">{letter}</strong></div>)}</div>
 </div></div><div className="seat-legend"><div><span className="legend-swatch legend-standard"/>Standard</div><div><span className="legend-swatch legend-premium"/>Premium</div><div><span className="legend-swatch legend-vip"/>VIP</div><div><span className="legend-swatch legend-mine"/>Your seats</div><div><span className="legend-swatch legend-unavailable"/>Unavailable</div></div>
 <div className="seat-foot-note"><Info size={16}/> Seat holds are enforced by the database. Seats held by other people are unavailable.</div>
 </section>;
}
