import { test, describe } from 'node:test';
import assert from 'node:assert';

describe('IronPeak Lightweight Production Suite', () => {
  test('GET /api/health returns ok status', async () => {
    const res = await fetch('http://localhost:4000/api/health');
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.status, 'ok');
    assert.strictEqual(data.service, 'ironpeak-engineering-solutions');
  });

  test('GET /api/services returns seeded services', async () => {
    const res = await fetch('http://localhost:4000/api/services');
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.data.length >= 6);
    assert.ok(data.data.some(s => s.slug === 'mechanical-maintenance'));
  });

  test('GET /api/services/:slug returns single service', async () => {
    const res = await fetch('http://localhost:4000/api/services/mechanical-maintenance');
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.data.slug, 'mechanical-maintenance');
    assert.ok(Array.isArray(data.data.features));
  });

  test('GET /api/projects returns seeded project concepts', async () => {
    const res = await fetch('http://localhost:4000/api/projects');
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.data.length >= 4);
    assert.ok(data.data.some(p => p.slug === 'industrial-workshop-fabrication-concept'));
  });

  test('POST /api/enquiries accepts valid submission', async () => {
    const res = await fetch('http://localhost:4000/api/enquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Mambwe Chanda',
        companyName: 'Chibuluma Mines Plc',
        email: 'mambwe@chibuluma.example',
        phone: '+260 97 123 4567',
        serviceCategory: 'Mechanical Maintenance',
        projectLocation: 'Kalulushi, Copperbelt',
        projectDescription: 'Planned maintenance overhaul for secondary ball mill trunnion bearings.',
        expectedTimeframe: 'Next 30 days',
        additionalRequirements: 'Preferred Contact: Email'
      })
    });
    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.id);
  });

  test('POST /api/enquiries rejects invalid email', async () => {
    const res = await fetch('http://localhost:4000/api/enquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'John Doe',
        companyName: 'Test Corp',
        email: 'not-an-email',
        phone: '1234567',
        projectDescription: 'This is a test description that is long enough.'
      })
    });
    assert.strictEqual(res.status, 422);
    const data = await res.json();
    assert.strictEqual(data.success, false);
  });

  test('POST /api/contact accepts message', async () => {
    const res = await fetch('http://localhost:4000/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bwalya Mwape',
        companyName: 'Mwape Heavy Logistics',
        email: 'bwalya@mwape.example',
        phone: '+260 96 987 6543',
        subject: 'Workshop Fabrication Inquiry',
        message: 'We are looking to fabricate modular overhead crane gantry assemblies.'
      })
    });
    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.strictEqual(data.success, true);
  });

  test('GET / serves HTML index with 200 OK', async () => {
    const res = await fetch('http://localhost:4000/');
    assert.strictEqual(res.status, 200);
    const text = await res.text();
    assert.ok(text.includes('IRONPEAK'));
    assert.ok(text.includes('Mechanical Maintenance'));
  });

  test('GET /robots.txt and /sitemap.xml are accessible', async () => {
    const robots = await fetch('http://localhost:4000/robots.txt');
    assert.strictEqual(robots.status, 200);
    const sitemap = await fetch('http://localhost:4000/sitemap.xml');
    assert.strictEqual(sitemap.status, 200);
  });
});
