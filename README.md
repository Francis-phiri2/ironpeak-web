# IronPeak Engineering Solutions

A high-performance, lightweight, deployment-ready industrial engineering portfolio website concept created by Mawu Creatives. Built for immediate production hosting with zero build delay, embedded persistence, and instant first-paint delivery.

---

## ⚡ Key Highlights & Architecture

- **Lightweight Unified Stack:** Zero external database overhead. Uses Node.js with built-in SQLite (`node:sqlite`), Express 5, Helmet, Rate Limiting, and Zod.
- **Instant First Paint (No Loading Spinners):** All service catalogs, demonstration project concepts, industry sectors, and brand details are rendered directly in semantic HTML on the first request. No "Loading services…" flicker.
- **Self-Contained & Portable:** Runs anywhere without external MongoDB connection strings or separate frontend build pipelines.
- **Production Hardened:**
  - Content Security Policy (CSP) with Google Fonts & Unsplash image rules
  - Rate limiting on public contact and enquiry endpoints
  - Honeypot anti-spam bot defense
  - Timing-safe authentication for admin endpoints
  - Full SEO metadata: Open Graph, Twitter Cards, `robots.txt`, and `sitemap.xml`
  - High-res SVG favicon

---

## 🚀 Quick Start (Local Run)

### Requirements
- **Node.js 20+ or 24+** (tested and verified on Node v24.16.0)
- **npm** (v10+)

### Commands
```bash
# 1. Install lightweight dependencies
npm install

# 2. Copy environment variables (optional, defaults work out of the box)
cp .env.example .env

# 3. Start the production server
npm start
```

Visit **`http://localhost:4000`** in your browser. The embedded SQLite database (`./data/ironpeak.sqlite`) and all default services and demonstration projects are automatically created and seeded on first launch.

To run during development with automatic reloading:
```bash
npm run dev
```

To run the automated test suite:
```bash
npm test
```

---

## 🌐 1-Click & Cloud Hosting Ready

The project includes pre-configured configurations for all major cloud providers:

### Option 1: Render.com (1-Click Blueprint)
A [`render.yaml`](./render.yaml) blueprint is included:
1. Link your repository in Render.
2. Render detects `render.yaml` automatically, provisions a persistent 1GB SQLite disk, and starts the service.

### Option 2: Railway / Fly.io / Heroku
The included [`Procfile`](./Procfile) defines the web process:
```procfile
web: node server.js
```
Simply connect your repo to Railway or Fly.io; persistent volume mounts should point to `/app/data`.

### Option 3: Docker Container
A multi-stage, hardened [`Dockerfile`](./Dockerfile) is provided:
```bash
# Build the container
docker build -t ironpeak-engineering .

# Run with a persistent data volume
docker run -d -p 4000:4000 -v ironpeak-data:/app/data --name ironpeak ironpeak-engineering
```

---

## 🛠️ API Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/health` | Service health status and uptime | None |
| `GET` | `/api/services` | Complete list of all active services | None |
| `GET` | `/api/services/:slug` | Detailed specifications for a service | None |
| `GET` | `/api/projects` | All demonstration project concepts | None |
| `GET` | `/api/projects/:slug` | Detail view of a project concept | None |
| `POST` | `/api/enquiries` | Submit detailed project enquiry (validated by Zod) | None (Rate limited) |
| `POST` | `/api/contact` | Submit general contact message | None (Rate limited) |
| `GET` | `/api/admin/enquiries` | Retrieve latest customer enquiries (up to 100) | `Bearer <ADMIN_TOKEN>` |
| `GET` | `/api/admin/summary` | Stats summary of enquiries, messages, services | `Bearer <ADMIN_TOKEN>` |

### Sample Enquiry Request Body (`POST /api/enquiries`)
```json
{
  "name": "Mambwe Chanda",
  "companyName": "Chibuluma Mines Plc",
  "email": "mambwe@chibuluma.example",
  "phone": "+260 97 123 4567",
  "serviceCategory": "Mechanical Maintenance",
  "projectLocation": "Kalulushi, Copperbelt",
  "projectDescription": "Planned maintenance overhaul for secondary ball mill trunnion bearings.",
  "expectedTimeframe": "Next 30 days",
  "additionalRequirements": "Preferred Contact: Email"
}
```

---

## ⚙️ Environment Variables

Create `.env` using `.env.example`:

```ini
PORT=4000
HOST=0.0.0.0
DATABASE_PATH=./data/ironpeak.sqlite
TRUST_PROXY=0
ADMIN_TOKEN=ironpeak-secret-admin-token-change-me-in-production
NODE_ENV=production
```

---

## 📁 Repository Structure

```
ironpeak/
├── public/                 # Ultra-fast, zero-delay static frontend
│   ├── index.html          # Semantic HTML5, CSS custom tokens, responsive UI
│   ├── favicon.svg         # Geometric brand mark
│   ├── robots.txt          # Search engine crawler policies
│   └── sitemap.xml         # XML sitemap for SEO indexation
├── server.js               # Express 5 server + embedded SQLite database
├── package.json            # Root configuration & scripts
├── Dockerfile              # Containerization recipe
├── .dockerignore           # Container ignore rules
├── Procfile                # Process declaration for PaaS
├── render.yaml             # Render.com infrastructure blueprint
├── test/
│   └── server.test.js      # Automated test suite (9 test cases)
└── README.md
```

*(Note: Legacy subdirectories `backend/` and `frontend/` contain the older experimental Angular & Mongo setups and are preserved for archive reference.)*
