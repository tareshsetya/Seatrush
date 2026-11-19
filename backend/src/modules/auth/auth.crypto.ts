import { createHmac, randomBytes, scrypt as nativeScrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { AppError } from '../../core/errors/index.js';
const scrypt = promisify(nativeScrypt);
const JWT_ISSUER = 'seatrush-api';
const JWT_AUDIENCE = 'seatrush-web';
const encode = (v: object): string => Buffer.from(JSON.stringify(v)).toString('base64url');
function secret(): string {
  const value = process.env.JWT_SECRET || '';
  if (value.length < 32) throw new Error('JWT_SECRET must contain at least 32 random characters');
  if (process.env.NODE_ENV === 'production' && value.includes('local-development-only')) throw new Error('Change JWT_SECRET before production');
  return value;
}
export function checkJwtSetup(): void { void secret(); }
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }) as Buffer;
  return `scrypt$32768$${salt.toString('base64url')}$${hash.toString('base64url')}`;
}
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 4 || parts[0] !== 'scrypt' || parts[1] !== '32768') return false;
  const salt = Buffer.from(parts[2], 'base64url');
  const expected = Buffer.from(parts[3], 'base64url');
  if (salt.length !== 16 || expected.length !== 64) return false;
  const actual = await scrypt(password, salt, expected.length, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }) as Buffer;
  return timingSafeEqual(expected, actual);
}
export function signJwt(subject: string, tokenVersion: number): string {
  const now = Math.floor(Date.now() / 1000);
  const header = encode({typ:'JWT',alg:'HS256'});
  const payload = encode({iss:JWT_ISSUER,aud:JWT_AUDIENCE,sub:subject,ver:tokenVersion,iat:now,nbf:now,exp:now+60*60*8});
  const content = `${header}.${payload}`;
  const signature = createHmac('sha256',secret()).update(content).digest('base64url');
  return `${content}.${signature}`;
}
export function verifyJwt(token: string): { userId: string; version: number } {
  const parts = token.split('.');
  if (parts.length !== 3 || parts.some(s => s.length > 4096 || !s)) throw new AppError('Sign in again',401,'INVALID_SESSION');
  const [header,payload,signature] = parts;
  const expected = createHmac('sha256',secret()).update(`${header}.${payload}`).digest();
  const received = Buffer.from(signature,'base64url');
  if (received.length !== expected.length || !timingSafeEqual(received,expected)) throw new AppError('Sign in again',401,'INVALID_SESSION');
  let h:any, v:any;
  try{h=JSON.parse(Buffer.from(header,'base64url').toString());v=JSON.parse(Buffer.from(payload,'base64url').toString());}
  catch{throw new AppError('Sign in again',401,'INVALID_SESSION');}
  const now=Math.floor(Date.now()/1000);
  if(h?.alg!=='HS256'||h.typ!=='JWT'||v?.iss!==JWT_ISSUER||v?.aud!==JWT_AUDIENCE||
      typeof v.sub!=='string'||!/^[-0-9a-f]{36}$/i.test(v.sub)||
      !Number.isInteger(v.ver)||!Number.isInteger(v.exp)||v.exp<=now||
      !Number.isInteger(v.nbf)||v.nbf>now||!Number.isInteger(v.iat)||v.iat>now+30)
    throw new AppError('Sign in again',401,'INVALID_SESSION');
  return { userId:v.sub,version:v.ver };
}
