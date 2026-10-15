import {test} from 'node:test';import assert from 'node:assert/strict';import request from 'supertest';import app from '../src/app.js';
test('health endpoint responds with API status',async()=>{const res=await request(app).get('/api/health');assert.equal(res.status,200);assert.equal(res.body.success,true);assert.equal(res.body.status,'ok')});
test('invalid enquiry payload is rejected before database access',async()=>{const res=await request(app).post('/api/enquiries').send({name:'A',email:'bad'});assert.equal(res.status,422);assert.equal(res.body.success,false);assert.ok(res.body.errors)});
test('administrator endpoints reject unauthenticated requests',async()=>{const res=await request(app).get('/api/enquiries');assert.equal(res.status,401)});
test('unknown routes return a consistent 404 response',async()=>{const res=await request(app).get('/api/missing');assert.equal(res.status,404);assert.equal(res.body.success,false)});
