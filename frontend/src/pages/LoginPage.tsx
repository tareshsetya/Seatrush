import React,{useState} from 'react';
import {ArrowRight,ArrowLeft,Eye,EyeOff,ShieldCheck,Ticket,LockKeyhole} from 'lucide-react';
import {api} from '../services/api';
import {UserProfile} from '../types';
interface Props {onLoginSuccess:(user:UserProfile)=>void;onBack:()=>void;}
export function LoginPage({onLoginSuccess,onBack}:Props){
 const [register,setRegister]=useState(false);const [name,setName]=useState('');const [email,setEmail]=useState('');
 const [password,setPassword]=useState('');const [show,setShow]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 const submit=async(e:React.FormEvent)=>{e.preventDefault();setError('');setBusy(true);
  try{const user=register?await api.register(name,email,password):await api.login(email,password);onLoginSuccess(user);}
  catch(e:any){setError(e.message||'Unable to sign in');}finally{setBusy(false);}
 };
 return <div className="auth-page site-shell"><section className="auth-story"><div className="auth-story-content"><div className="auth-story-mark"><Ticket size={24}/> seat<span>rush.</span></div><span className="eyebrow light">YOUR NEXT GREAT NIGHT STARTS HERE</span><h1>Less scrolling.<br/>More <em>living.</em></h1><p>From front-row energy to unforgettable movie nights. Your plans, all in one place.</p><div className="auth-trust"><ShieldCheck size={19}/> Secure account · Protected seat reservations</div></div></section>
 <section className="auth-form-wrap"><button className="text-back" onClick={onBack}><ArrowLeft size={17}/> Back to exploring</button><div className="auth-form-inner"><span className="eyebrow">WELCOME TO SEATRUSH</span><h2>{register?'Make an account.':'Good to have you back.'}</h2><p className="muted">{register?'Create an account to save seats and track your demo tickets.':'Sign in to continue your booking.'}</p>
 <form onSubmit={submit}>{register&&<label className="form-field"><span>Full name</span><input autoComplete="name" required minLength={2} maxLength={80} value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"/></label>}
 <label className="form-field"><span>Email address</span><input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label>
 <label className="form-field"><span>Password</span><div className="password-input"><input type={show?'text':'password'} autoComplete={register?'new-password':'current-password'} minLength={register?10:1} required value={password} onChange={e=>setPassword(e.target.value)} placeholder={register?'At least 10 characters':'Enter your password'}/><button type="button" className="icon-btn" onClick={()=>setShow(!show)} aria-label={show?'Hide password':'Show password'}>{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>
 {register&&<p className="form-help">Use 10 or more characters. Passwords are securely hashed before storage.</p>}
 {error&&<p className="inline-error" role="alert">{error}</p>}
 <button type="submit" disabled={busy} className="btn btn-coral auth-submit">{busy?'Please wait…':register?'Create account':'Sign in'}<ArrowRight size={18}/></button></form>
 <p className="auth-switch">{register?'Already have an account?':'New to SeatRush?'} <button onClick={()=>{setRegister(!register);setError('');}}>{register?'Sign in':'Create an account'}</button></p>
 <p className="auth-security"><LockKeyhole size={15}/> Your session is stored in a secure HttpOnly cookie.</p>
 </div></section></div>;
}
