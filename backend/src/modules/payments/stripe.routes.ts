import { Router, Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import { AppError } from '../../core/errors/index.js';
const router=Router();
/** Signed events only. No booking is created by an unverified payload.
 * The actual payment-intent checkout is a future phase, NOT silently mocked.
 */
router.post('/webhook', async(req:Request,res:Response,next:NextFunction)=>{
  try{
    const secret=process.env.STRIPE_WEBHOOK_SECRET;
    const stripeKey=process.env.STRIPE_SECRET_KEY;
    if(!secret||!stripeKey) throw new AppError('Stripe integration is not configured',503,'STRIPE_DISABLED');
    const signature=req.headers['stripe-signature'];
    if(typeof signature!=='string') throw new AppError('Stripe signature is required',400,'INVALID_SIGNATURE');
    const stripe=new Stripe(stripeKey);
    const event=stripe.webhooks.constructEvent(req.body,signature,secret);
    // No Stripe PaymentIntent creation yet; consciously do NOT issue tickets here.
    console.info('Verified Stripe event received (no checkout integration):',event.type,event.id);
    res.json({received:true});
  }catch(error){next(error);}
});
router.post('/simulate-webhook',(_req:Request,res:Response)=>{
  res.status(501).json({success:false,message:'Fake Stripe webhooks are disabled. Use a signed Stripe test event after payment integration.'});
});
export default router;
