import {describe,it} from 'node:test';
import assert from 'node:assert/strict';
import {hashPassword,verifyPassword,signJwt,verifyJwt} from '../src/modules/auth/auth.crypto.js';

describe('SeatRush credential hashing and signed sessions',()=>{
  it('hashes passwords with a unique salt and rejects incorrect passwords',async()=>{
    const a=await hashPassword('aSecurePassword1234');
    const b=await hashPassword('aSecurePassword1234');
    assert.notEqual(a,b);
    assert.equal(await verifyPassword('aSecurePassword1234',a),true);
    assert.equal(await verifyPassword('incorrect',a),false);
  });
  it('JWT rejects altered payloads and invalid signatures',()=>{
    process.env.JWT_SECRET='unit-tests-only-very-long-unpredictable-seatrush-secret';
    const token=signJwt('123e4567-e89b-12d3-a456-426614174000',3);
    assert.equal(verifyJwt(token).version,3);
    const parts=token.split('.');parts[1]='e30';
    assert.throws(()=>verifyJwt(parts.join('.')));
    assert.throws(()=>verifyJwt(token.slice(0,-5)+'xxxxx'));
  });
});
