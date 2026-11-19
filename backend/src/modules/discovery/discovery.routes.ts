import { Router,Request,Response,NextFunction } from 'express';
import {redisService} from '../../core/redis/redis-client.js';
import {AppError} from '../../core/errors/index.js';
const router=Router();
type DiscoveryItem={id:string;source:'ticketmaster'|'tmdb';kind:'event'|'movie';title:string;subtitle:string;image:string;date:string;venue:string;city:string;url:string;category:string;};
const cities:Record<string,{search:string;country:string}>={
  'Delhi-NCR':{search:'New Delhi',country:'IN'},'Mumbai':{search:'Mumbai',country:'IN'},'Bengaluru':{search:'Bangalore',country:'IN'},
  'Hyderabad':{search:'Hyderabad',country:'IN'},'Chandigarh':{search:'Chandigarh',country:'IN'},
  'Ahmedabad':{search:'Ahmedabad',country:'IN'},'Pune':{search:'Pune',country:'IN'},'Chennai':{search:'Chennai',country:'IN'},
  'Kolkata':{search:'Kolkata',country:'IN'},'Kochi':{search:'Kochi',country:'IN'},
  'Jaipur':{search:'Jaipur',country:'IN'},'Lucknow':{search:'Lucknow',country:'IN'},'Goa':{search:'Panaji',country:'IN'},
  'London':{search:'London',country:'GB'},'New York':{search:'New York',country:'US'},'Los Angeles':{search:'Los Angeles',country:'US'},
};
const allowedUrl=(value:unknown):string=>typeof value==='string' && /^https:\/\//.test(value)?value:'';
async function getJson(url:string,headers?:Record<string,string>):Promise<any>{
  const response=await fetch(url,{headers,signal:AbortSignal.timeout(6500)});
  if(!response.ok)throw new Error(`Provider HTTP ${response.status}`);
  return response.json();
}
async function ticketmaster(city:string,search:string):Promise<DiscoveryItem[]>{
  const key=process.env.TICKETMASTER_API_KEY;
  if(!key)return [];
  const params=new URLSearchParams({apikey:key,city:cities[city].search,countryCode:cities[city].country,
    sort:'date,asc',size:'24',startDateTime:new Date().toISOString().replace(/\.\d{3}Z$/,'Z')});
  if(search)params.set('keyword',search);
  const data=await getJson(`https://app.ticketmaster.com/discovery/v2/events.json?${params}`);
  const entries=Array.isArray(data?._embedded?.events)?data._embedded.events:[];
  return entries.map((e:any):DiscoveryItem=>({
    id:`tm-${String(e.id||'')}`,source:'ticketmaster',kind:'event',title:String(e.name||'Untitled event'),
    subtitle:String(e.classifications?.[0]?.segment?.name||'Live event'),
    image:allowedUrl((e.images||[]).sort((a:any,b:any)=>Number(b.width||0)-Number(a.width||0))[0]?.url),
    date:String(e.dates?.start?.localDate||''),venue:String(e._embedded?.venues?.[0]?.name||'Venue to be announced'),
    city:String(e._embedded?.venues?.[0]?.city?.name||city),url:allowedUrl(e.url),
    category:String(e.classifications?.[0]?.segment?.name||'Live event'),
  })).filter((e:DiscoveryItem)=>!!e.url).slice(0,24);
}
async function tmdb(query:string):Promise<DiscoveryItem[]>{
  const key=process.env.TMDB_API_KEY;
  if(!key)return [];
  const useBearer=key.startsWith('eyJ');
  const endpoint=query?'search/movie':'movie/now_playing';
  const params=new URLSearchParams({language:'en-IN',region:'IN',page:'1'});
  if(query)params.set('query',query);
  if(!useBearer)params.set('api_key',key);
  const data=await getJson(`https://api.themoviedb.org/3/${endpoint}?${params}`,useBearer?{Authorization:`Bearer ${key}`}:{ });
  const entries=Array.isArray(data?.results)?data.results:[];
  return entries.filter((m:any)=>m.id&&m.title).map((m:any):DiscoveryItem=>({
    id:`movie-${m.id}`,source:'tmdb',kind:'movie',title:String(m.title),subtitle:'Movie details · not cinema showtimes',
    image:m.poster_path?`https://image.tmdb.org/t/p/w500${m.poster_path}`:'',date:String(m.release_date||''),
    venue:'Cinema times unavailable',city:'India',url:`https://www.themoviedb.org/movie/${m.id}`,
    category:'Movies',
  })).slice(0,18);
}
router.get('/',async(req:Request,res:Response,next:NextFunction)=>{
  try{
    const city=String(req.query.city||'Delhi-NCR');
    const q=String(req.query.q||'').trim().slice(0,80);
    const type=String(req.query.type||'all');
    if(!Object.hasOwn(cities,city))throw new AppError('Please select a supported city',400,'INVALID_CITY');
    if(!['all','events','movies'].includes(type))throw new AppError('Invalid discovery category',400,'INVALID_TYPE');
    const cacheKey=`discover:v1:${city}:${type}:${q.toLowerCase()}`;
    const redis=redisService.getConnected()?redisService.getClient():null;
    if(redis){try{const cached=await redis.get(cacheKey);if(cached){res.json(JSON.parse(cached));return;}}catch{/* Query providers directly */}}
    const result=await Promise.allSettled([type==='movies'?Promise.resolve([]):ticketmaster(city,q),type==='events'?Promise.resolve([]):tmdb(q)]);
    const providerErrors:string[]=[];
    if(result[0].status==='rejected' && process.env.TICKETMASTER_API_KEY)providerErrors.push('Ticketmaster data temporarily unavailable');
    if(result[1].status==='rejected' && process.env.TMDB_API_KEY)providerErrors.push('Movie data temporarily unavailable');
    const items=[...(result[0].status==='fulfilled'?result[0].value:[]),...(result[1].status==='fulfilled'?result[1].value:[])];
    const payload={success:true,data:items,meta:{city,providers:{ticketmaster:!!process.env.TICKETMASTER_API_KEY,tmdb:!!process.env.TMDB_API_KEY},warnings:providerErrors,
      notice:'External listings are for discovery only. Ticketing, live prices and cinema seat availability are not provided by SeatRush.'}};
    if(redis){try{await redis.set(cacheKey,JSON.stringify(payload),'EX',300);}catch{/* Ignore cache failures */}}
    res.json(payload);
  }catch(e){next(e);}
});
export default router;
