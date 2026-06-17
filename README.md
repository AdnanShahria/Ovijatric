# Ovijatrik - RUET Adventure Club
*Time To Explore*

This project is a modern, responsive web application for the RUET Adventure Club. It uses a separated microservices architecture.

## Architecture

- **Frontend**: Vite + React + TypeScript + Tailwind CSS v4. Housed in the `/Frontend` directory.
- **Backend**: Cloudflare Workers + Hono.js. Uses Turso (libSQL) and Drizzle ORM. Housed in the `/Backend` directory.

## Getting Started

### Prerequisites
- Node.js (v18+)
- `npm`

### Environment Variables
You need to set up environment variables for the Backend to run properly. 
Create a `.dev.vars` file inside the `/Backend` folder with the following:

```env
TURSO_DATABASE_URL="libsql://your-db-url.turso.io"
TURSO_AUTH_TOKEN="your-turso-auth-token"
GROQ_API_KEY="your-groq-api-key"
IMGBB_API_KEY="your-imgbb-api-key"
ADMIN_JWT_SECRET="your-secret-here"
```

### Running the Backend
1. `cd Backend`
2. `npm install`
3. Generate DB migrations: `npm run db:generate`
4. Run locally: `npm run dev`

### Running the Frontend
1. `cd Frontend`
2. `npm install`
3. Run locally: `npm run dev`

## Features
- Fully responsive, mobile-first design with beautiful animations.
- Admin dashboard for managing gallery, events, team, and blogs.
- Real-time Groq (Llama 3.3) Chatbot Integration for intelligent assistance.
- Turso global distributed database for ultra-low latency.
- ImgBB integration for image hosting.
