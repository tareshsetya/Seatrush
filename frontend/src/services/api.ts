import {Booking,ConcurrencyMetrics,Event,HoldSeatResponse,Seat,UserProfile,DiscoveryItem,DiscoveryMeta} from '../types';
const API_BASE=`${(import.meta.env.VITE_API_URL||'').replace(/\/$/,'')}/api`;
async function request<T>(path:string,options:RequestInit={}):Promise<T>{
  let response:Response;
  try{response=await fetch(`${API_BASE}${path}`,{...options,credentials:'include',headers:{...(options.body?{'Content-Type':'application/json'}:{}),...options.headers}});}
  catch{throw new Error('Cannot connect to SeatRush. Check that the backend is running.');}
  let json:any;
  try{json=await response.json();}catch{throw new Error(`API request failed (${response.status})`);}
  if(!response.ok)throw new Error(json?.message||`Request failed (${response.status})`);
  return json;
}
export const api={
  register:async(name:string,email:string,password:string):Promise<UserProfile>=> (await request<{data:UserProfile}>('/auth/register',{method:'POST',body:JSON.stringify({name,email,password})})).data,
  login:async(email:string,password:string):Promise<UserProfile>=> (await request<{data:UserProfile}>('/auth/login',{method:'POST',body:JSON.stringify({email,password})})).data,
  me:async():Promise<UserProfile>=> (await request<{data:UserProfile}>('/auth/me')).data,
  logout:async():Promise<void>=>{await request('/auth/logout',{method:'POST'});},
  getEvents:async():Promise<Event[]>=> (await request<{data:Event[]}>('/events')).data,
  getEvent:async(id:string):Promise<Event>=> (await request<{data:Event}>(`/events/${encodeURIComponent(id)}`)).data,
  getSeats:async(eventId:string):Promise<Seat[]>=> (await request<{data:Seat[]}>(`/seats/${encodeURIComponent(eventId)}`)).data,
  holdSeats:async(eventId:string,seatIds:string[],_userId?:string):Promise<HoldSeatResponse>=>
    request<HoldSeatResponse>('/seats/hold',{method:'POST',body:JSON.stringify({eventId,seatIds})}),
  releaseSeats:async(eventId:string,seatIds:string[],_userId?:string):Promise<Seat[]>=>
    (await request<{data:Seat[]}>('/seats/release',{method:'POST',body:JSON.stringify({eventId,seatIds})})).data,
  createBooking:async(payload:{eventId:string;seatIds:string[];idempotencyKey:string;[key:string]:any}):Promise<{booking:Booking;isReplay:boolean}>=>{
    const json=await request<{data:Booking;isReplay:boolean}>('/bookings',{method:'POST',headers:{'Idempotency-Key':payload.idempotencyKey},
      body:JSON.stringify({eventId:payload.eventId,seatIds:payload.seatIds})});
    return{booking:json.data,isReplay:!!json.isReplay};
  },
  getBooking:async(id:string):Promise<Booking>=> (await request<{data:Booking}>(`/bookings/${encodeURIComponent(id)}`)).data,
  getUserBookings:async():Promise<Booking[]>=> (await request<{data:Booking[]}>('/bookings/mine')).data,
  discover:async(city:string,q='',type:'all'|'events'|'movies'='all'):Promise<{data:DiscoveryItem[];meta:DiscoveryMeta}>=>
    request<{data:DiscoveryItem[];meta:DiscoveryMeta}>(`/discover?${new URLSearchParams({city,q,type})}`),
  getAdminMetrics:async():Promise<ConcurrencyMetrics>=> (await request<{data:ConcurrencyMetrics}>('/admin/metrics')).data,
  runBenchmark:async(targetSeats:string[],usersCount:number)=> (await request<any>('/admin/benchmark',{method:'POST',body:JSON.stringify({targetSeats,usersCount})})).data,
  fastForwardExpiry:async()=>request<any>('/admin/fast-forward',{method:'POST'}),
  simulateWebhook:async(webhookEvent:any)=>request<any>('/payments/simulate-webhook',{method:'POST',body:JSON.stringify({webhookEvent})}),
  simulateContention:async(eventId:string,seatIds:string[],users:number)=>request<any>('/admin/simulate',{method:'POST',body:JSON.stringify({eventId,seatIds,users})}),
  resetDatabase:async()=>request<any>('/admin/reset',{method:'POST'}),
};
