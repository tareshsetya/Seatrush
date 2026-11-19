import React,{useEffect,useState} from 'react';
import {Activity,Database,LockKeyhole,RefreshCw,ShieldCheck,Ticket,ArrowRight} from 'lucide-react';import {api} from '../services/api';import {ConcurrencyMetrics} from '../types';
export function AdminDashboardPage(){const [stats,setStats]=useState<ConcurrencyMetrics|null>(null);const [error,setError]=useState('');const [busy,setBusy]=useState(false);
 const load=async()=>{setBusy(true);try{setStats(await api.getAdminMetrics());setError('');}catch(e:any){setError(e.message)}finally{setBusy(false)}};
 useEffect(()=>{void load()},[]);
 const values=[{title:'Active holds',value:stats?.activeHolds??'—',icon:LockKeyhole},{title:'Bookings',value:stats?.totalBookings??'—',icon:Ticket},{title:'Expired holds released',value:stats?.expiredHoldsReleased??'—',icon:RefreshCw},{title:'Idempotency hits',value:stats?.idempotencyHits??'—',icon:ShieldCheck}];
 return <main className="site-shell admin-v2"><div className="section-eyebrow">INTERNAL · ADMINISTRATOR ONLY</div><div className="admin-top"><div><h1>SeatRush operations</h1><p>Database-backed booking metrics for authorized administrators.</p></div><button className="btn btn-outline" onClick={load} disabled={busy}><RefreshCw size={16}/>{busy?'Refreshing…':'Refresh metrics'}</button></div>
 {error&&<p className="inline-error">{error}</p>}<div className="admin-kpis">{values.map(v=><div className="admin-kpi" key={v.title}><v.icon size={25}/><span>{v.title}</span><strong>{v.value}</strong></div>)}</div>
 <section className="admin-explain"><Activity size={27}/><div><h2>A note on production readiness</h2><p>This dashboard uses measured server state; demonstration mode still requires secure payments, deployments with durable queue workers, monitoring and penetration testing before accepting real customers.</p></div></section>
 </main>;
}
