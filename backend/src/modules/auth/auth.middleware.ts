import { Request, Response, NextFunction } from 'express';
import { postgresService } from '../../database/postgres.js';
import { AppError } from '../../core/errors/index.js';
import { verifyJwt } from './auth.crypto.js';
export interface AuthUser { id:string; name:string; email:string; role:'CUSTOMER'|'ADMIN'; createdAt:string; tokenVersion:number }
declare global { namespace Express { interface Request { authUser?: AuthUser } } }
export const COOKIE = 'sr_session';
export const cookieOptions = () => ({
  httpOnly:true, secure:process.env.NODE_ENV==='production', path:'/',
  sameSite:(process.env.AUTH_COOKIE_SAMESITE==='none' && process.env.NODE_ENV==='production' ? 'none' : 'lax') as 'none'|'lax',
  maxAge:8*60*60*1000,
});
function parseCookie(req:Request, name:string):string | undefined {
  const cookies=(req.headers.cookie||'').split(';');
  const match=cookies.find(x=>x.trim().startsWith(`${name}=`));
  return match ? decodeURIComponent(match.trim().slice(name.length+1)) : undefined;
}
export const optionalAuth = async(req:Request,_res:Response,next:NextFunction):Promise<void>=>{
  try{
    const token = parseCookie(req,COOKIE);
    if(!token){next();return;}
    const claims=verifyJwt(token);
    const {rows}=await postgresService.query(`SELECT id,name,email,role,token_version AS "tokenVersion",created_at AS "createdAt"
      FROM users WHERE id=$1`,[claims.userId]);
    const row=rows[0];
    if(row && Number(row.tokenVersion)===claims.version){req.authUser={id:row.id,name:row.name,email:row.email,role:row.role,tokenVersion:Number(row.tokenVersion),createdAt:new Date(row.createdAt).toISOString()};}
    next();
  }catch(error){
    // Expired/invalid sessions behave as signed-out, allowing a fresh login.
    if(error instanceof AppError && error.code==='INVALID_SESSION'){next();return;}
    next(error);
  }
};
export const requireAuth = (req:Request,_res:Response,next:NextFunction):void=>{
  if(!req.authUser){next(new AppError('Please sign in to continue',401,'AUTH_REQUIRED'));return;}
  next();
};
export const requireAdmin = (req:Request,_res:Response,next:NextFunction):void=>{
  if(req.authUser?.role!=='ADMIN'){next(new AppError('Administrator access required',403,'ADMIN_ONLY'));return;}
  next();
};
