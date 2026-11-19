import { Router, Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import { postgresService } from '../../database/postgres.js';
import { AppError } from '../../core/errors/index.js';
import { hashPassword,verifyPassword,signJwt } from './auth.crypto.js';
import { COOKIE,cookieOptions,requireAuth } from './auth.middleware.js';
import {authRateLimit} from './auth.rate-limit.js';
const router=Router();
const wrap=(fn:(req:Request,res:Response)=>Promise<void>)=>(req:Request,res:Response,next:NextFunction)=>{fn(req,res).catch(next);};
const safeUser=(u:any)=>({id:u.id,name:u.name,email:u.email,role:u.role,joinedDate:new Date(u.created_at||u.createdAt).toISOString()});
const emailRe=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function validEmail(raw:unknown):string{
  const email=String(raw||'').trim().toLowerCase();
  if(email.length>254||!emailRe.test(email))throw new AppError('Enter a valid email address',400,'INVALID_EMAIL');
  return email;
}
function validPassword(raw:unknown):string{
  if(typeof raw!=='string'||raw.length<10||raw.length>128)throw new AppError('Password must contain 10–128 characters',400,'INVALID_PASSWORD');
  return raw;
}
router.post('/register',authRateLimit,wrap(async(req,res)=>{
  const email=validEmail(req.body?.email); const password=validPassword(req.body?.password);
  const name=String(req.body?.name||'').trim();
  if(name.length<2||name.length>80)throw new AppError('Name must be 2–80 characters',400,'INVALID_NAME');
  const id=randomUUID();const passwordHash=await hashPassword(password);
  let result;
  try{result=await postgresService.query(`INSERT INTO users(id,name,email,password_hash,role) VALUES($1,$2,$3,$4,'CUSTOMER') RETURNING id,name,email,role,created_at`,[id,name,email,passwordHash]);}
  catch(e:any){if(e?.code==='23505')throw new AppError('An account with this email already exists',409,'EMAIL_IN_USE');throw e;}
  const user=result.rows[0];res.cookie(COOKIE,signJwt(id,0),cookieOptions());res.status(201).json({success:true,data:safeUser(user)});
}));
router.post('/login',authRateLimit,wrap(async(req,res)=>{
  const email=validEmail(req.body?.email);const password=String(req.body?.password||'');
  const {rows}=await postgresService.query(`SELECT id,name,email,role,password_hash,token_version,created_at FROM users WHERE email=$1`,[email]);
  const user=rows[0];
  if(!user){throw new AppError('Incorrect email or password',401,'INVALID_CREDENTIALS');}
  if(!(await verifyPassword(password,user.password_hash)))throw new AppError('Incorrect email or password',401,'INVALID_CREDENTIALS');
  res.cookie(COOKIE,signJwt(user.id,Number(user.token_version)),cookieOptions());
  res.json({success:true,data:safeUser(user)});
}));
router.get('/me',requireAuth,wrap(async(req,res)=>{res.json({success:true,data:{...req.authUser,joinedDate:req.authUser!.createdAt}});}));
router.post('/logout',wrap(async(req,res)=>{
  // Invalidate the current account's previous JWTs by changing token_version.
  if(req.authUser)await postgresService.query(`UPDATE users SET token_version=token_version+1 WHERE id=$1`,[req.authUser.id]);
  res.clearCookie(COOKIE,{path:'/',sameSite:cookieOptions().sameSite,secure:cookieOptions().secure});
  res.json({success:true});
}));
export default router;
