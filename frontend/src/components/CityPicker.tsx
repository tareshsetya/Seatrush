import React,{useMemo,useState} from 'react';
import { Search, X, MapPin, LocateFixed, Building2, Landmark, Palmtree, Building, LoaderCircle } from 'lucide-react';
export const CITIES=[
 {name:'Mumbai',lat:19.076,long:72.878},{name:'Delhi-NCR',lat:28.614,long:77.209},{name:'Bengaluru',lat:12.972,long:77.594},
 {name:'Hyderabad',lat:17.385,long:78.487},{name:'Chandigarh',lat:30.733,long:76.779},{name:'Ahmedabad',lat:23.022,long:72.571},
 {name:'Pune',lat:18.52,long:73.856},{name:'Chennai',lat:13.083,long:80.271},{name:'Kolkata',lat:22.573,long:88.364},
 {name:'Kochi',lat:9.931,long:76.267},{name:'Jaipur',lat:26.912,long:75.788},{name:'Lucknow',lat:26.847,long:80.946},
 {name:'Goa',lat:15.49,long:73.827},{name:'London',lat:51.507,long:-.128},{name:'New York',lat:40.713,long:-74.006},
 {name:'Los Angeles',lat:34.052,long:-118.244},
];
interface Props {open:boolean;onSelect:(city:string)=>void;onClose?:()=>void;}
export function CityPicker({open,onSelect,onClose}:Props){
 const [filter,setFilter]=useState('');const [all,setAll]=useState(false);const [locating,setLocating]=useState(false);const [error,setError]=useState('');
 const visible=useMemo(()=>CITIES.filter(c=>c.name.toLowerCase().includes(filter.trim().toLowerCase())).slice(0,all||filter?100:10),[filter,all]);
 if(!open)return null;
 const detect=()=>{
   if(!navigator.geolocation){setError('Location is not available in this browser. Please choose a city.');return;}
   setLocating(true);setError('');
   navigator.geolocation.getCurrentPosition(({coords})=>{
    const rad=(d:number)=>d*Math.PI/180;
    const distance=(a:number,b:number,c:number,d:number)=>{const x=Math.sin(rad(c-a)/2)**2+Math.cos(rad(a))*Math.cos(rad(c))*Math.sin(rad(d-b)/2)**2;return 6371*2*Math.asin(Math.sqrt(x));};
    const ranked=CITIES.map(c=>({c,d:distance(coords.latitude,coords.longitude,c.lat,c.long)})).sort((a,b)=>a.d-b.d)[0];
    setLocating(false);
    if(ranked.d>150){setError('No supported city within 150 km. Please select one manually.');return;}
    onSelect(ranked.c.name);
   },()=>{setLocating(false);setError('Location permission denied or unavailable. Please select your city.');},{timeout:10000,maximumAge:600000});
 };
 return <div className="city-overlay" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)onClose?.();}}>
  <div className="city-modal" role="dialog" aria-modal="true" aria-labelledby="city-heading">
    <div className="city-topline"><span className="eyebrow">WELCOME TO SEATRUSH</span>{onClose&&<button className="icon-btn" onClick={onClose} aria-label="Close"><X size={20}/></button>}</div>
    <h2 id="city-heading">Where are we making plans?</h2><p className="muted">Choose your city to discover events near you.</p>
    <label className="city-search"><Search size={19}/><input autoFocus value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Search your city" aria-label="Search cities"/></label>
    <button className="location-action" onClick={detect} disabled={locating}>
      {locating?<LoaderCircle size={17} className="spin"/>:<LocateFixed size={17}/>} {locating?'Finding your nearest city…':'Detect my location'}
    </button>
    {error&&<p className="inline-error">{error}</p>}
    <div className="city-section-label">{filter?'Search results':'POPULAR CITIES'}</div>
    <div className="city-grid">{visible.map((c,i)=><button className="city-choice" key={c.name} onClick={()=>onSelect(c.name)}>
      <div className="city-illustration">{i%5===0?<Building2/>:i%5===1?<Landmark/>:i%5===2?<Building/>:i%5===3?<Palmtree/>:<MapPin/>}</div>
      <span>{c.name}</span>
    </button>)}</div>
    {visible.length===0&&<p className="empty-note">No matching cities. Try another name.</p>}
    {!filter&&<button className="city-more" onClick={()=>setAll(!all)}>{all?'Show popular cities':'View all cities'}</button>}
    <div className="city-foot">We only request your location with permission. Your coordinates are not uploaded.</div>
  </div>
 </div>;
}
