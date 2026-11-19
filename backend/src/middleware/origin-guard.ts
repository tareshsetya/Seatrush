import {Request,Response,NextFunction} from 'express';
/** Reject browser cross-site cookie actions (including simple requests). */
export function originGuard(req:Request,res:Response,next:NextFunction):void {
  if(['GET','HEAD','OPTIONS'].includes(req.method) || req.path==='/api/payments/webhook'){next();return;}
  const origin=req.get('origin');
  if(!origin){
    if(process.env.NODE_ENV==='production'){res.status(403).json({success:false,message:'Origin required for browser mutations'});return;}
    next();return;
  }
  const allowed=[...(process.env.FRONTEND_URL||'').split(','),'http://localhost:5173','http://127.0.0.1:5173'].map(v=>v.trim()).filter(Boolean);
  if(!allowed.includes(origin)){res.status(403).json({success:false,message:'Untrusted origin'});return;}
  next();
}
