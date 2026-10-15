import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
import { timingSafeEqual } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

const here = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4000);
const host = process.env.HOST || '0.0.0.0';

// Setup SQLite database
const dbDir = path.resolve(here, 'data');
mkdirSync(dbDir, { recursive: true });
const dbPath = path.resolve(here, process.env.DATABASE_PATH || './data/ironpeak.sqlite');
const db = new DatabaseSync(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    short_description TEXT NOT NULL,
    full_description TEXT NOT NULL,
    image_url TEXT NOT NULL,
    features TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT NOT NULL,
    is_demonstration INTEGER NOT NULL DEFAULT 1,
    published INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  );

  CREATE TABLE IF NOT EXISTS enquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    company_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    service_category TEXT NOT NULL DEFAULT '',
    project_location TEXT NOT NULL DEFAULT '',
    project_description TEXT NOT NULL,
    expected_timeframe TEXT NOT NULL DEFAULT '',
    additional_requirements TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'new',
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  );

  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    company_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  );

  CREATE INDEX IF NOT EXISTS idx_services_slug ON services(slug);
  CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);
  CREATE INDEX IF NOT EXISTS idx_enquiries_created ON enquiries(created_at);
  CREATE INDEX IF NOT EXISTS idx_contacts_created ON contacts(created_at);
`);

// Seed default services and projects if empty
const countServices = db.prepare('SELECT COUNT(*) as count FROM services').get();
if (countServices.count === 0) {
  const defaultServices = [
    {
      title: 'Mechanical Maintenance',
      slug: 'mechanical-maintenance',
      category: 'Maintenance',
      short_description: 'Planned and corrective support for mechanical systems and critical equipment.',
      full_description: 'Practical mechanical maintenance support designed around your operating priorities. Scope can include inspections, fault diagnosis, planned maintenance tasks and clear handover notes. All examples are illustrative and subject to site requirements.',
      image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1000&q=80',
      features: JSON.stringify(['Planned and corrective maintenance', 'Inspection and condition reporting', 'Shutdown task support']),
      active: 1
    },
    {
      title: 'Industrial Fabrication',
      slug: 'industrial-fabrication',
      category: 'Fabrication',
      short_description: 'Workshop fabrication concepts for structural and operational requirements.',
      full_description: 'Fabrication support for industrial components and steelwork, from early scope discussion through fabrication planning and quality checks. Final scope, materials and standards depend on project requirements.',
      image_url: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=1000&q=80',
      features: JSON.stringify(['Steel structures and platforms', 'Repair and modification concepts', 'Fabrication coordination']),
      active: 1
    },
    {
      title: 'Equipment Servicing',
      slug: 'equipment-servicing',
      category: 'Servicing',
      short_description: 'Routine servicing support to help keep equipment ready for operation.',
      full_description: 'A considered approach to equipment servicing that supports reliability and safe operation, including service planning, inspections and maintenance records.',
      image_url: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=1000&q=80',
      features: JSON.stringify(['Routine service planning', 'Inspection support', 'Maintenance records']),
      active: 1
    },
    {
      title: 'Plant Maintenance',
      slug: 'plant-maintenance',
      category: 'Maintenance',
      short_description: 'Coordinated maintenance support for plant assets and operating teams.',
      full_description: 'Plant maintenance support that helps teams coordinate work scopes, schedules, resources and handovers across operating environments.',
      image_url: 'https://images.unsplash.com/photo-1567789884554-0b844b597180?auto=format&fit=crop&w=1000&q=80',
      features: JSON.stringify(['Maintenance coordination', 'Shutdown planning support', 'Work package preparation']),
      active: 1
    },
    {
      title: 'Engineering Consultation',
      slug: 'engineering-consultation',
      category: 'Consultation',
      short_description: 'Clear technical input to inform decisions, scope and project planning.',
      full_description: 'Engineering consultation for early stage scoping, options reviews and technical project discussions. Specialist professional sign-off is provided only where separately agreed and appropriately qualified.',
      image_url: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=1000&q=80',
      features: JSON.stringify(['Scope definition', 'Technical options reviews', 'Project planning input']),
      active: 1
    },
    {
      title: 'Technical Project Support',
      slug: 'technical-project-support',
      category: 'Project support',
      short_description: 'Hands-on coordination and technical support from planning through delivery.',
      full_description: 'Flexible project support to help clarify deliverables, coordinate stakeholders and maintain clear technical communication throughout the project lifecycle.',
      image_url: 'https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?auto=format&fit=crop&w=1000&q=80',
      features: JSON.stringify(['Technical coordination', 'Progress and handover records', 'Stakeholder communication']),
      active: 1
    }
  ];

  const insertService = db.prepare(`
    INSERT INTO services (title, slug, category, short_description, full_description, image_url, features, active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const s of defaultServices) {
    insertService.run(s.title, s.slug, s.category, s.short_description, s.full_description, s.image_url, s.features, s.active);
  }
}

const countProjects = db.prepare('SELECT COUNT(*) as count FROM projects').get();
if (countProjects.count === 0) {
  const defaultProjects = [
    {
      title: 'Industrial Workshop Fabrication Concept',
      slug: 'industrial-workshop-fabrication-concept',
      category: 'Fabrication',
      description: 'Illustrative concept for a functional fabrication workshop layout and steelwork package. Fictional portfolio content; no client work is implied.',
      image_url: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=1200&q=80',
      is_demonstration: 1,
      published: 1
    },
    {
      title: 'Heavy Equipment Maintenance Concept',
      slug: 'heavy-equipment-maintenance-concept',
      category: 'Maintenance',
      description: 'A fictional visual concept exploring planned maintenance support for heavy equipment in an industrial environment.',
      image_url: 'https://images.unsplash.com/photo-1513828583688-c52646db42da?auto=format&fit=crop&w=1200&q=80',
      is_demonstration: 1,
      published: 1
    },
    {
      title: 'Plant Maintenance Planning Concept',
      slug: 'plant-maintenance-planning-concept',
      category: 'Project support',
      description: 'Illustrative planning concept for coordinating maintenance activities across plant assets. This is not a completed project.',
      image_url: 'https://images.unsplash.com/photo-1567789884554-0b844b597180?auto=format&fit=crop&w=1200&q=80',
      is_demonstration: 1,
      published: 1
    },
    {
      title: 'Industrial Steel Structure Concept',
      slug: 'industrial-steel-structure-concept',
      category: 'Fabrication',
      description: 'Fictional steel structure concept used to demonstrate the IronPeak portfolio presentation. No real customer or site is represented.',
      image_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
      is_demonstration: 1,
      published: 1
    }
  ];

  const insertProject = db.prepare(`
    INSERT INTO projects (title, slug, category, description, image_url, is_demonstration, published)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  for (const p of defaultProjects) {
    insertProject.run(p.title, p.slug, p.category, p.description, p.image_url, p.is_demonstration, p.published);
  }
}

// Validation schemas
const enquirySchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  companyName: z.string().trim().min(2, 'Company name is required').max(120),
  email: z.string().trim().email('Please provide a valid email address').max(254),
  phone: z.string().trim().min(5, 'Phone number must be at least 5 digits').max(40),
  serviceCategory: z.string().trim().max(100).optional().default('General Enquiry'),
  projectLocation: z.string().trim().max(120).optional().default(''),
  projectDescription: z.string().trim().min(10, 'Project details must be at least 10 characters').max(3000),
  expectedTimeframe: z.string().trim().max(100).optional().default(''),
  additionalRequirements: z.string().trim().max(2000).optional().default(''),
  website: z.string().max(0).optional() // Honeypot field for bot prevention
});

const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  companyName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(40).optional().default(''),
  subject: z.string().trim().min(2).max(160),
  message: z.string().trim().min(10).max(3000),
  website: z.string().max(0).optional() // Honeypot
});

const app = express();

if (process.env.TRUST_PROXY === '1' || process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.disable('x-powered-by');

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https://images.unsplash.com'],
      connectSrc: ["'self'"]
    }
  }
}));

app.use(cors());
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));

// Rate limiters
const submissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many submissions. Please wait a few minutes before trying again.' }
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false
});

// API Routes
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    status: 'ok',
    service: 'ironpeak-engineering-solutions',
    database: 'sqlite-embedded',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/services', (req, res) => {
  const rows = db.prepare('SELECT id, title, slug, category, short_description as shortDescription, full_description as fullDescription, image_url as imageUrl, features, active FROM services WHERE active = 1 ORDER BY id ASC').all();
  const data = rows.map(r => ({
    ...r,
    features: JSON.parse(r.features || '[]')
  }));
  res.json({ success: true, count: data.length, data });
});

app.get('/api/services/:idOrSlug', (req, res) => {
  const param = req.params.idOrSlug;
  const isNumeric = /^\d+$/.test(param);
  const row = isNumeric
    ? db.prepare('SELECT id, title, slug, category, short_description as shortDescription, full_description as fullDescription, image_url as imageUrl, features, active FROM services WHERE id = ?').get(Number(param))
    : db.prepare('SELECT id, title, slug, category, short_description as shortDescription, full_description as fullDescription, image_url as imageUrl, features, active FROM services WHERE slug = ?').get(param);

  if (!row) {
    return res.status(404).json({ success: false, message: 'Service not found' });
  }
  res.json({ success: true, data: { ...row, features: JSON.parse(row.features || '[]') } });
});

app.get('/api/projects', (_req, res) => {
  const rows = db.prepare('SELECT id, title, slug, category, description, image_url as imageUrl, is_demonstration as isDemonstration, published, created_at as createdAt FROM projects WHERE published = 1 ORDER BY id ASC').all();
  res.json({ success: true, count: rows.length, data: rows });
});

app.get('/api/projects/:idOrSlug', (req, res) => {
  const param = req.params.idOrSlug;
  const isNumeric = /^\d+$/.test(param);
  const row = isNumeric
    ? db.prepare('SELECT id, title, slug, category, description, image_url as imageUrl, is_demonstration as isDemonstration, published, created_at as createdAt FROM projects WHERE id = ?').get(Number(param))
    : db.prepare('SELECT id, title, slug, category, description, image_url as imageUrl, is_demonstration as isDemonstration, published, created_at as createdAt FROM projects WHERE slug = ?').get(param);

  if (!row) {
    return res.status(404).json({ success: false, message: 'Project not found' });
  }
  res.json({ success: true, data: row });
});

app.post('/api/enquiries', submissionLimiter, (req, res) => {
  const parseResult = enquirySchema.safeParse(req.body);
  if (!parseResult.success) {
    const errorMsg = parseResult.error.errors[0]?.message || 'Invalid form submission';
    return res.status(422).json({ success: false, message: errorMsg, errors: parseResult.error.errors });
  }

  const v = parseResult.data;
  // Bot check
  if (v.website) {
    return res.status(200).json({ success: true, message: 'Your enquiry has been received.' });
  }

  const stmt = db.prepare(`
    INSERT INTO enquiries (name, company_name, email, phone, service_category, project_location, project_description, expected_timeframe, additional_requirements)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(v.name, v.companyName, v.email, v.phone, v.serviceCategory, v.projectLocation, v.projectDescription, v.expectedTimeframe, v.additionalRequirements);

  res.status(201).json({
    success: true,
    message: 'Thank you. Your project enquiry has been received by IronPeak.',
    id: info.lastInsertRowid
  });
});

app.post('/api/contact', submissionLimiter, (req, res) => {
  const parseResult = contactSchema.safeParse(req.body);
  if (!parseResult.success) {
    const errorMsg = parseResult.error.errors[0]?.message || 'Invalid message submission';
    return res.status(422).json({ success: false, message: errorMsg, errors: parseResult.error.errors });
  }

  const v = parseResult.data;
  if (v.website) {
    return res.status(200).json({ success: true, message: 'Your message has been sent.' });
  }

  const stmt = db.prepare(`
    INSERT INTO contacts (name, company_name, email, phone, subject, message)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(v.name, v.companyName, v.email, v.phone, v.subject, v.message);

  res.status(201).json({
    success: true,
    message: 'Thank you. Your message has been sent to our team.',
    id: info.lastInsertRowid
  });
});

// Admin endpoints
app.get('/api/admin/enquiries', adminLimiter, (req, res) => {
  const configuredToken = process.env.ADMIN_TOKEN;
  if (!configuredToken) {
    return res.status(503).json({ success: false, message: 'Admin access is not configured. Set ADMIN_TOKEN in .env' });
  }
  const authHeader = req.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
  const expected = Buffer.from(configuredToken);
  const supplied = Buffer.from(authHeader);

  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
    return res.status(401).json({ success: false, message: 'Unauthorized access.' });
  }

  const enquiries = db.prepare('SELECT * FROM enquiries ORDER BY id DESC LIMIT 100').all();
  res.json({ success: true, count: enquiries.length, data: enquiries });
});

app.get('/api/admin/summary', adminLimiter, (req, res) => {
  const configuredToken = process.env.ADMIN_TOKEN;
  if (!configuredToken) {
    return res.status(503).json({ success: false, message: 'Admin access is not configured.' });
  }
  const authHeader = req.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
  const expected = Buffer.from(configuredToken);
  const supplied = Buffer.from(authHeader);

  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
    return res.status(401).json({ success: false, message: 'Unauthorized access.' });
  }

  const totalEnquiries = db.prepare('SELECT COUNT(*) as c FROM enquiries').get().c;
  const newEnquiries = db.prepare("SELECT COUNT(*) as c FROM enquiries WHERE status = 'new'").get().c;
  const totalContacts = db.prepare('SELECT COUNT(*) as c FROM contacts').get().c;
  const totalServices = db.prepare('SELECT COUNT(*) as c FROM services').get().c;
  const totalProjects = db.prepare('SELECT COUNT(*) as c FROM projects').get().c;

  res.json({
    success: true,
    data: {
      totalEnquiries,
      newEnquiries,
      totalContacts,
      totalServices,
      totalProjects
    }
  });
});

// Static assets serving from public
const publicDir = path.resolve(here, 'public');
app.use(express.static(publicDir, {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0
}));

// Fallback to index.html for Single Page Application navigation
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API route not found' });
  }
  res.sendFile(path.resolve(publicDir, 'index.html'));
});

// Error handling
app.use((err, req, res, _next) => {
  console.error('Unhandled server error:', err.message);
  res.status(500).json({ success: false, message: 'An unexpected server error occurred.' });
});

// Graceful startup and shutdown
const server = app.listen(port, host, () => {
  console.log(`IronPeak server listening on http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`);
});

const shutdown = () => {
  console.log('Shutting down IronPeak server...');
  server.close(() => {
    try { db.close(); } catch {}
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export default app;
