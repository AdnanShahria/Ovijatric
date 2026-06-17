# AS — AI Code Generation Guide: Multilithic Architecture

> **This document is written FOR AI coding assistants** (Cursor, Copilot, Claude, Windsurf, Bolt, v0, Lovable, Replit Agent, or any LLM-powered code generation tool).
>
> When an AI agent reads this document, it should be able to scaffold, extend, and maintain a multilithic web application with zero human clarification needed.
>
> Feed this document to your AI tool as context/system prompt when starting or modifying a project.

---

## SECTION 0: READ THIS FIRST — WHAT YOU ARE BUILDING

You are building a **multilithic web application**. This means:

- **Multiple independent SPA shells** (separate HTML files, separate React trees, separate bundles)
- **Compiled and deployed as ONE unit** to Cloudflare Pages
- **One backend worker** (Cloudflare Pages Function) handles all API routes
- **One database** (Turso/LibSQL — edge SQLite)
- **Shared code** (CSS tokens, utilities, types) across shells, but NO shared runtime state

**Mental model:** Think of it as 3–5 separate React apps that share a codebase and a deployment. They communicate through `localStorage` and full page navigations, never through shared React context at runtime.

---

## SECTION 1: THE SKELETON — EXACT FILE STRUCTURE

When creating a new project, generate EXACTLY this structure. Every file listed below is required unless marked `[OPTIONAL]`.

```
{project-name}/
├── package.json
├── wrangler.toml
├── .dev.vars
├── .gitignore
│
├── frontend/
│   ├── index.html
│   ├── auth.html
│   ├── app.html
│   ├── vite.config.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   │
│   ├── public/
│   │   ├── favicon.png                    [OPTIONAL]
│   │   └── _redirects
│   │
│   └── src/
│       ├── entry-index.tsx
│       ├── entry-auth.tsx
│       ├── entry-app.tsx
│       ├── index.css
│       ├── vite-env.d.ts
│       │
│       ├── apps/
│       │   ├── IndexApp.tsx
│       │   ├── AuthApp.tsx
│       │   └── MainApp.tsx
│       │
│       ├── pages/
│       │   └── (feature modules go here)
│       │
│       ├── components/
│       │   ├── app/
│       │   │   └── AppLayout.tsx
│       │   ├── landing/                   [OPTIONAL]
│       │   ├── auth/                      [OPTIONAL]
│       │   └── shared/                    [OPTIONAL]
│       │
│       ├── contexts/
│       │   └── ThemeContext.tsx
│       │
│       └── utils/
│           ├── apiClient.ts
│           └── cn.ts
│
├── functions/
│   ├── [[route]].ts
│   ├── cloudflare-env.d.ts
│   ├── tsconfig.json
│   │
│   └── _api-core/
│       ├── index.ts
│       ├── utils.ts
│       │
│       ├── routes/
│       │   └── auth.ts
│       │
│       └── api/
│           └── dynamicHandler.ts
│
├── database/
│   └── schema.sql
│
└── scripts/                               [OPTIONAL]
    └── dev-start.js                       [OPTIONAL]
```

---

## SECTION 2: EXACT FILE CONTENTS — COPY VERBATIM

### 2.1 Root `package.json`

```json
{
  "name": "{project-name}",
  "private": true,
  "workspaces": ["frontend"],
  "scripts": {
    "dev": "concurrently --raw \"npm run dev --workspace=frontend\" \"wrangler pages dev frontend/public --port 8788 --compatibility-flag=nodejs_compat\"",
    "build": "npm run build --workspace=frontend",
    "deploy": "npm run build && wrangler pages deploy dist"
  },
  "devDependencies": {
    "concurrently": "^9.0.0",
    "wrangler": "^4.0.0"
  },
  "dependencies": {
    "@libsql/client": "^0.17.0"
  }
}
```

### 2.2 `wrangler.toml`

```toml
name = "{project-name}"
compatibility_date = "2024-12-01"
compatibility_flags = ["nodejs_compat"]
```

### 2.3 `.dev.vars`

```
TURSO_DATABASE_URL=libsql://{project-name}-{username}.turso.io
TURSO_AUTH_TOKEN=your-turso-auth-token
JWT_SECRET=generate-a-64-char-random-hex-string
```

### 2.4 `.gitignore`

```
node_modules/
**/node_modules/
**/dist/
.dev.vars
**/.dev.vars
.env
*.env
**/.env
.wrangler/
**/.wrangler/
**/scratch/
.secrets.json
```

### 2.5 `frontend/package.json`

```json
{
  "name": "{project-name}-frontend",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^7.1.0",
    "framer-motion": "^11.15.0",
    "lucide-react": "^0.460.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.6.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.0",
    "typescript": "~5.6.0",
    "vite": "^6.0.0"
  }
}
```

### 2.6 Shell HTML Files

**RULE:** Each shell HTML file MUST have a unique `<title>` and its own `<script type="module">` pointing to a unique entry TSX.

**`frontend/index.html`:**
```html
<!doctype html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{PROJECT_NAME}</title>
    <meta name="description" content="{SEO description for the landing/public pages}" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  </head>
  <body class="antialiased">
    <div id="root"></div>
    <script type="module" src="/src/entry-index.tsx"></script>
  </body>
</html>
```

**`frontend/auth.html`:**
```html
<!doctype html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{PROJECT_NAME} — Sign In</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  </head>
  <body class="antialiased">
    <div id="root"></div>
    <script type="module" src="/src/entry-auth.tsx"></script>
  </body>
</html>
```

**`frontend/app.html`:**
```html
<!doctype html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
    <title>{PROJECT_NAME} — Dashboard</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  </head>
  <body class="antialiased">
    <div id="root"></div>
    <script type="module" src="/src/entry-app.tsx"></script>
  </body>
</html>
```

### 2.7 Entry Points

**RULE:** Every entry point does EXACTLY three things: import its App, import `index.css`, call `createRoot`. Nothing else.

**`frontend/src/entry-index.tsx`:**
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import IndexApp from './apps/IndexApp'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <IndexApp />
  </React.StrictMode>,
)
```

**`frontend/src/entry-auth.tsx`:**
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import AuthApp from './apps/AuthApp'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthApp />
  </React.StrictMode>,
)
```

**`frontend/src/entry-app.tsx`:**
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import MainApp from './apps/MainApp'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MainApp />
  </React.StrictMode>,
)
```

### 2.8 Application Roots

**RULE:** Each App component creates its OWN `<BrowserRouter>`. Never share a router between shells.

**`frontend/src/apps/IndexApp.tsx`:**
```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '../contexts/ThemeContext'
// Import your landing pages here

function IndexApp() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<div>Landing Page</div>} />
          {/* Add public page routes here */}
          <Route path="*" element={<div>Landing Page</div>} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default IndexApp
```

**`frontend/src/apps/AuthApp.tsx`:**
```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '../contexts/ThemeContext'
// Import your auth page here

function AuthApp() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<div>Auth Page</div>} />
          <Route path="/auth.html" element={<div>Auth Page</div>} />
          <Route path="*" element={<div>Auth Page</div>} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default AuthApp
```

**`frontend/src/apps/MainApp.tsx`:**
```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '../contexts/ThemeContext'
import { AppLayout } from '../components/app/AppLayout'
// Import your feature pages here

function MainApp() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<div>Dashboard</div>} />
            {/* Add feature routes here */}
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default MainApp
```

### 2.9 App Layout

**`frontend/src/components/app/AppLayout.tsx`:**
```tsx
import { Outlet } from 'react-router-dom'

export const AppLayout = () => {
  return (
    <div className="flex h-[100dvh] bg-background text-white overflow-hidden">
      {/* Sidebar — add your sidebar component here */}
      <aside className="hidden md:flex w-64 flex-col border-r border-white/5 bg-slate-900/50 p-4">
        <nav className="flex-1 space-y-1">
          {/* Navigation links go here. Use <a href="/app/..."> for same-shell navigation
              or window.location.href for cross-shell */}
          <a href="/app" className="block px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
            Dashboard
          </a>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}
```

### 2.10 Vite Config

**`frontend/vite.config.ts`:**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'shell-rewrite-middleware',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // ─── DEV-MODE SPA REWRITES ───────────────────────────────
          // In production, _redirects handles this.
          // In development, this middleware does the same job.
          //
          // ADD A LINE HERE for every shell EXCEPT index.html:
          const rewrites: Record<string, string> = {
            '/app':  '/app.html',
            '/auth': '/auth.html',
            // '/admin': '/admin.html',    ← Uncomment if you add an admin shell
            // '/seller': '/seller.html',  ← Uncomment if you add a seller shell
          }
          if (req.url) {
            for (const [prefix, html] of Object.entries(rewrites)) {
              if (req.url.startsWith(prefix) && !req.url.includes('.')) {
                req.url = html
                break
              }
            }
          }
          next()
        })
      }
    }
  ],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: './index.html',
        auth: './auth.html',
        app:  './app.html',
        // admin: './admin.html',    ← Uncomment if you add an admin shell
      }
    }
  },
  server: {
    host: '127.0.0.1',    // MANDATORY: Force IPv4. Node 17+ defaults to IPv6, wrangler uses IPv4.
    port: 5173,
    strictPort: true,
    proxy: {
      '/api':   { target: 'http://127.0.0.1:8788', changeOrigin: true },
      '/auth/': { target: 'http://127.0.0.1:8788', changeOrigin: true },
    }
  }
})
```

### 2.11 `_redirects`

**`frontend/public/_redirects`:**
```
/app/* /app.html 200
/* /index.html 200
```

**RULE:** Most specific rules FIRST. The `/*` catch-all MUST be the LAST line.

### 2.12 Shared Stylesheet

**`frontend/src/index.css`:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --bg-main: #f8fafc;
    --text-main: #0f172a;
    --color-white-rgb: 0 0 0;
    --color-primary-rgb: 59 130 246;
    --color-primary-glow-rgb: 96 165 250;
  }

  .dark {
    --bg-main: #0b1121;
    --text-main: #f8fafc;
    --color-white-rgb: 255 255 255;
    --color-primary-rgb: 59 130 246;
    --color-primary-glow-rgb: 96 165 250;
  }

  body {
    background-color: var(--bg-main);
    color: var(--text-main);
    transition: background-color 0.3s, color 0.3s;
  }
}

@layer utilities {
  .glass-panel {
    @apply bg-white/5 backdrop-blur-md shadow-xl;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
  .glass-card {
    @apply bg-white/[0.03] backdrop-blur-md transition-colors duration-200;
    border: 1px solid rgba(255, 255, 255, 0.05);
  }
}
```

### 2.13 Tailwind Config

**`frontend/tailwind.config.js`:**
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./auth.html",
    "./app.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      colors: {
        background: 'var(--bg-main)',
        white: 'rgb(var(--color-white-rgb) / <alpha-value>)',
        primary: {
          DEFAULT: 'rgb(var(--color-primary-rgb) / <alpha-value>)',
          glow: 'rgb(var(--color-primary-glow-rgb) / <alpha-value>)',
        },
      },
    },
  },
  plugins: [],
}
```

### 2.14 PostCSS Config

**`frontend/postcss.config.js`:**
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### 2.15 TypeScript Configs

**`frontend/tsconfig.json`:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**`frontend/tsconfig.node.json`:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

**`frontend/src/vite-env.d.ts`:**
```typescript
/// <reference types="vite/client" />
```

### 2.16 Theme Context

**`frontend/src/contexts/ThemeContext.tsx`:**
```tsx
import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextType {
  theme: Theme
  setTheme: (t: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('app-theme') as Theme | null
    return saved === 'light' ? 'light' : 'dark'
  })

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('dark', 'light')
    root.classList.add(theme)
    localStorage.setItem('app-theme', theme)
  }, [theme])

  const setTheme = (t: Theme) => setThemeState(t)
  const toggleTheme = () => setThemeState(prev => prev === 'dark' ? 'light' : 'dark')

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}
```

### 2.17 API Client

**`frontend/src/utils/apiClient.ts`:**
```typescript
const API_URL = ''   // Same origin — no prefix needed

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = localStorage.getItem('auth_token')
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

export async function apiGet<T = any>(path: string): Promise<{ success: boolean; data: T; error?: string }> {
  const res = await fetch(`${API_URL}${path}`, { headers: getAuthHeaders() })
  const json = await res.json()
  if (res.status === 401) {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    window.location.href = '/auth'
  }
  return json
}

export async function apiPost<T = any>(path: string, body: any): Promise<{ success: boolean; data: T; error?: string }> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  })
  return res.json()
}

export async function apiPut<T = any>(path: string, body: any): Promise<{ success: boolean; data: T; error?: string }> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  })
  return res.json()
}

export async function apiDelete(path: string): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  return res.json()
}

// ─── DYNAMIC CRUD HELPERS ──────────────────────────────────────────────────────
// These map to the generic /api/dynamic/{table} endpoint.

interface DynamicQueryOptions {
  eq?: Record<string, string | number>
  neq?: Record<string, string | number>
  ilike?: Record<string, string>
  order?: string
  dir?: 'asc' | 'desc'
  limit?: number
}

export async function dynamicGet<T = any>(table: string, options: DynamicQueryOptions = {}): Promise<T[]> {
  const params = new URLSearchParams()
  if (options.eq) Object.entries(options.eq).forEach(([k, v]) => params.append(`eq_${k}`, String(v)))
  if (options.neq) Object.entries(options.neq).forEach(([k, v]) => params.append(`neq_${k}`, String(v)))
  if (options.ilike) Object.entries(options.ilike).forEach(([k, v]) => params.append(`ilike_${k}`, v))
  if (options.order) params.append('order', options.order)
  if (options.dir) params.append('dir', options.dir)
  if (options.limit) params.append('limit', String(options.limit))

  const qs = params.toString()
  const res = await apiGet<T[]>(`/api/dynamic/${table}${qs ? '?' + qs : ''}`)
  return res.data || []
}

export async function dynamicInsert<T = any>(table: string, data: Partial<T>): Promise<T> {
  const res = await apiPost<T>(`/api/dynamic/${table}`, data)
  return res.data
}

export async function dynamicUpdate<T = any>(table: string, data: Partial<T> & { id: string }): Promise<T> {
  const res = await apiPut<T>(`/api/dynamic/${table}`, data)
  return res.data
}

export async function dynamicDelete(table: string, filters: Record<string, string>): Promise<void> {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => params.append(`eq_${k}`, v))
  await apiDelete(`/api/dynamic/${table}?${params.toString()}`)
}
```

### 2.18 `cn` Utility

**`frontend/src/utils/cn.ts`:**
```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### 2.19 The Catch-All Worker

**`functions/[[route]].ts`:**
```typescript
import worker from './_api-core/index'

export const onRequest = async (context: any) => {
  const url = new URL(context.request.url)

  // ── STATIC ASSETS → CDN ─────────────────────────────────────────
  const staticExts = ['.html','.js','.css','.png','.jpg','.jpeg','.gif','.svg','.ico','.woff','.woff2','.ttf','.map','.webp','.avif']
  if (
    staticExts.some(ext => url.pathname.endsWith(ext)) ||
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/node_modules') ||
    url.pathname.startsWith('/src/')
  ) {
    return context.next()
  }

  // ── API & AUTH ROUTES → WORKER ───────────────────────────────────
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/auth/') ||
    url.pathname === '/status'
  ) {
    return worker.fetch(context.request, context.env as any, context as any)
  }

  // ── EVERYTHING ELSE → CDN (SPA fallback via _redirects) ─────────
  return context.next()
}
```

### 2.20 Backend Router

**`functions/_api-core/index.ts`:**
```typescript
import { createClient } from "@libsql/client/web"
import { corsHeaders } from "./utils"
import { handleAuthRoutes } from "./routes/auth"
import { handleDynamicRoute } from "./api/dynamicHandler"

export interface Env {
  TURSO_DATABASE_URL: string
  TURSO_AUTH_TOKEN: string
  JWT_SECRET?: string
  [key: string]: any
}

export default {
  async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
    const url = new URL(request.url)

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders })
    }

    // Health check
    if (url.pathname === "/status") {
      return new Response(JSON.stringify({ status: "ok", db: !!env.TURSO_DATABASE_URL }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    // Create DB client (lazy — only if credentials exist)
    let db: any = null
    if (env.TURSO_DATABASE_URL && env.TURSO_AUTH_TOKEN) {
      try {
        db = createClient({ url: env.TURSO_DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN })
      } catch (e) {
        console.error("Failed to create DB client:", e)
      }
    }

    // ── HANDLER CHAIN ──────────────────────────────────────────────
    // Each handler returns Response | null.
    // First non-null response wins.
    // Add new handlers HERE, BEFORE the dynamic handler.

    let response: Response | null

    response = await handleAuthRoutes(url, request, db, env)
    if (response) return response

    // ADD YOUR CUSTOM HANDLERS HERE:
    // response = await handleOrderRoutes(url, request, db, env)
    // if (response) return response
    //
    // response = await handlePaymentRoutes(url, request, db, env)
    // if (response) return response

    // Generic CRUD — always LAST before 404
    response = await handleDynamicRoute(url, request, db, env)
    if (response) return response

    // Nothing matched
    return new Response(JSON.stringify({ error: "Not Found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }
}
```

### 2.21 Backend Utilities

**`functions/_api-core/utils.ts`:**
```typescript
// ─── CORS ──────────────────────────────────────────────────────────────────────
export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

// ─── UUID ──────────────────────────────────────────────────────────────────────
export function generateUUID(): string {
  return crypto.randomUUID()
}

// ─── BASE64URL ─────────────────────────────────────────────────────────────────
function encodeBase64Url(source: Uint8Array | string): string {
  let uint8: Uint8Array
  if (typeof source === 'string') {
    uint8 = new TextEncoder().encode(source)
  } else {
    uint8 = source
  }
  let binary = ''
  for (let i = 0; i < uint8.byteLength; i++) binary += String.fromCharCode(uint8[i])
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function decodeBase64Url(source: string): Uint8Array {
  const base64 = source.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - base64.length % 4) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

// ─── PASSWORD HASHING (PBKDF2 via Web Crypto) ─────────────────────────────────
export function generateSalt(length = 16): string {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveBits', 'deriveKey'])
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: enc.encode(salt), iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'HMAC', hash: 'SHA-256', length: 256 },
    true,
    ['sign']
  )
  const exported = await crypto.subtle.exportKey('raw', key)
  return Array.from(new Uint8Array(exported)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// ─── JWT (HMAC-SHA256 via Web Crypto) ──────────────────────────────────────────
export async function signToken(payload: any, secret: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' }
  const encodedHeader = encodeBase64Url(JSON.stringify(header))
  const encodedPayload = encodeBase64Url(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 }))
  const dataToSign = `${encodedHeader}.${encodedPayload}`
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(dataToSign))
  return `${dataToSign}.${encodeBase64Url(new Uint8Array(signature))}`
}

export async function verifyToken(request: Request, secret: string): Promise<any | null> {
  const authHeader = request.headers.get("Authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null
  const token = authHeader.substring(7)
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [encodedHeader, encodedPayload, encodedSignature] = parts
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'])
  const isValid = await crypto.subtle.verify('HMAC', key, decodeBase64Url(encodedSignature) as any, enc.encode(`${encodedHeader}.${encodedPayload}`))
  if (!isValid) return null
  try {
    const payload = JSON.parse(new TextDecoder().decode(decodeBase64Url(encodedPayload)))
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return null
    return payload
  } catch { return null }
}
```

### 2.22 Auth Route Handler

**`functions/_api-core/routes/auth.ts`:**
```typescript
import { hashPassword, generateSalt, signToken, generateUUID, corsHeaders } from '../utils'
import type { Env } from '../index'

export async function handleAuthRoutes(url: URL, request: Request, db: any, env: Env): Promise<Response | null> {
  const JWT_SECRET = env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod'

  // ── REGISTER ─────────────────────────────────────────────────────
  if (url.pathname === "/auth/register" && request.method === "POST") {
    try {
      const body: any = await request.json()
      const email = body.email?.trim().toLowerCase()
      const { password, name } = body

      if (!email || !password || !name) {
        return new Response(JSON.stringify({ error: "Missing required fields (email, password, name)" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        })
      }

      if (!db) {
        return new Response(JSON.stringify({ error: "Database unavailable" }), {
          status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" }
        })
      }

      // Check existing
      const existing = await db.execute({ sql: "SELECT id FROM users WHERE email = ?", args: [email] })
      if (existing.rows.length > 0) {
        return new Response(JSON.stringify({ error: "User already exists" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        })
      }

      // Hash password
      const salt = generateSalt()
      const hash = await hashPassword(password, salt)
      const userId = generateUUID()

      // Insert user — CUSTOMIZE COLUMNS FOR YOUR PROJECT
      await db.execute({
        sql: "INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)",
        args: [userId, email, `${salt}:${hash}`, name]
      })

      return new Response(JSON.stringify({
        success: true,
        user: { id: userId, email, name }
      }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }
  }

  // ── LOGIN ────────────────────────────────────────────────────────
  if (url.pathname === "/auth/login" && request.method === "POST") {
    try {
      const body: any = await request.json()
      const email = body.email?.trim().toLowerCase()
      const { password } = body

      if (!email || !password) {
        return new Response(JSON.stringify({ error: "Email and password required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        })
      }

      if (!db) {
        return new Response(JSON.stringify({ error: "Database unavailable" }), {
          status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" }
        })
      }

      const result = await db.execute({ sql: "SELECT * FROM users WHERE email = ?", args: [email] })
      if (result.rows.length === 0) {
        return new Response(JSON.stringify({ error: "Invalid email or password" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
        })
      }

      const user = result.rows[0]
      const [storedSalt, storedHash] = (user.password_hash as string).split(':')
      const computedHash = await hashPassword(password, storedSalt)

      if (computedHash !== storedHash) {
        return new Response(JSON.stringify({ error: "Invalid email or password" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
        })
      }

      const token = await signToken({ userId: user.id, email }, JWT_SECRET)

      return new Response(JSON.stringify({
        success: true,
        token,
        user: { id: user.id, email: user.email, name: user.name }
      }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }
  }

  return null
}
```

### 2.23 Dynamic CRUD Handler

**`functions/_api-core/api/dynamicHandler.ts`:**
```typescript
import { verifyToken, corsHeaders } from '../utils'
import type { Env } from '../index'

// ─── CONFIGURATION ─────────────────────────────────────────────────────────────
// CUSTOMIZE THESE FOR YOUR PROJECT:

// Tables that allow unauthenticated GET requests
const PUBLIC_READ_TABLES: string[] = ['products', 'categories']

// Tables that DON'T have an auto-generated 'id' column
const TABLES_WITHOUT_ID: string[] = ['cart_items', 'favorites']

// Row-Level Security: which column represents ownership per table
// Default fallback: 'user_id'
const OWNER_COLUMNS: Record<string, string> = {
  // 'posts': 'author_id',
  // 'reviews': 'author_id',
  // 'communities': 'created_by',
}

export async function handleDynamicRoute(url: URL, request: Request, db: any, env: Env): Promise<Response | null> {
  const pathParts = url.pathname.split('/')
  if (pathParts.length !== 4 || pathParts[1] !== 'api' || pathParts[2] !== 'dynamic') return null

  const table = pathParts[3]

  // Validate table name (prevent SQL injection)
  if (!/^[a-zA-Z0-9_]+$/.test(table)) {
    return new Response(JSON.stringify({ error: "Invalid table name" }), { status: 400, headers: corsHeaders })
  }

  // Auth check
  const payload = await verifyToken(request, env.JWT_SECRET || 'fallback')
  const isPublicRead = request.method === 'GET' && PUBLIC_READ_TABLES.includes(table)
  if (!payload && !isPublicRead) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders })
  }

  const ownerCol = OWNER_COLUMNS[table] || 'user_id'

  try {
    // ── GET ─────────────────────────────────────────────────────────
    if (request.method === "GET") {
      let sql = `SELECT * FROM ${table}`
      const args: any[] = []
      const whereClauses: string[] = []

      // RLS: only return rows owned by current user (unless public)
      if (payload && !PUBLIC_READ_TABLES.includes(table)) {
        whereClauses.push(`${ownerCol} = ?`)
        args.push(payload.userId)
      }

      // Dynamic filters from query params
      url.searchParams.forEach((val, key) => {
        if (key.startsWith('eq_')) {
          const col = key.replace('eq_', '')
          if (!/^[a-zA-Z0-9_]+$/.test(col)) return
          if (val === 'null') { whereClauses.push(`${col} IS NULL`) }
          else { whereClauses.push(`${col} = ?`); args.push(val) }
        } else if (key.startsWith('neq_')) {
          const col = key.replace('neq_', '')
          if (!/^[a-zA-Z0-9_]+$/.test(col)) return
          if (val === 'null') { whereClauses.push(`${col} IS NOT NULL`) }
          else { whereClauses.push(`${col} != ?`); args.push(val) }
        } else if (key.startsWith('ilike_')) {
          const col = key.replace('ilike_', '')
          if (!/^[a-zA-Z0-9_]+$/.test(col)) return
          whereClauses.push(`${col} LIKE ?`); args.push(`%${val}%`)
        }
      })

      if (whereClauses.length > 0) sql += ` WHERE ` + whereClauses.join(' AND ')

      const orderCol = url.searchParams.get("order")
      if (orderCol && /^[a-zA-Z0-9_]+$/.test(orderCol)) {
        sql += ` ORDER BY ${orderCol} ${url.searchParams.get("dir") === 'asc' ? 'ASC' : 'DESC'}`
      }

      const limit = url.searchParams.get("limit")
      if (limit && !isNaN(Number(limit))) { sql += ` LIMIT ?`; args.push(Number(limit)) }

      const res = db ? await db.execute({ sql, args }) : { rows: [] }
      return new Response(JSON.stringify({ success: true, data: res.rows }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    // ── POST (INSERT) ──────────────────────────────────────────────
    if (request.method === "POST") {
      const body: any = await request.json()

      // Auto-inject owner
      if (payload && !body[ownerCol]) body[ownerCol] = payload.userId

      // Auto-generate ID
      if (!body.id && !TABLES_WITHOUT_ID.includes(table)) body.id = crypto.randomUUID()

      const keys = Object.keys(body)
      for (const key of keys) {
        if (!/^[a-zA-Z0-9_]+$/.test(key)) {
          return new Response(JSON.stringify({ error: "Invalid column name" }), { status: 400, headers: corsHeaders })
        }
      }

      if (db) {
        await db.execute({
          sql: `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`,
          args: keys.map(k => body[k])
        })
      }
      return new Response(JSON.stringify({ success: true, data: body }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    // ── PUT (UPDATE) ───────────────────────────────────────────────
    if (request.method === "PUT") {
      const body: any = await request.json()
      if (!body.id) {
        return new Response(JSON.stringify({ error: "Missing id for update" }), { status: 400, headers: corsHeaders })
      }

      const updateKeys = Object.keys(body).filter(k => k !== 'id')
      if (updateKeys.length === 0) {
        return new Response(JSON.stringify({ success: true, data: body }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
        })
      }

      for (const key of updateKeys) {
        if (!/^[a-zA-Z0-9_]+$/.test(key)) {
          return new Response(JSON.stringify({ error: "Invalid column name" }), { status: 400, headers: corsHeaders })
        }
      }

      const args = [...updateKeys.map(k => body[k]), body.id]
      // RLS: only update rows owned by current user
      if (payload) { args.push(payload.userId) }

      if (db) {
        await db.execute({
          sql: `UPDATE ${table} SET ${updateKeys.map(k => `${k} = ?`).join(', ')} WHERE id = ?${payload ? ` AND ${ownerCol} = ?` : ''}`,
          args
        })
      }
      return new Response(JSON.stringify({ success: true, data: body }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    // ── DELETE ──────────────────────────────────────────────────────
    if (request.method === "DELETE") {
      const args: any[] = []
      const whereClauses: string[] = []

      url.searchParams.forEach((val, key) => {
        if (key.startsWith('eq_')) {
          const col = key.replace('eq_', '')
          if (/^[a-zA-Z0-9_]+$/.test(col)) { whereClauses.push(`${col} = ?`); args.push(val) }
        }
      })

      if (whereClauses.length === 0) {
        return new Response(JSON.stringify({ error: "Missing delete conditions" }), { status: 400, headers: corsHeaders })
      }

      // RLS
      if (payload) { whereClauses.push(`${ownerCol} = ?`); args.push(payload.userId) }

      if (db) {
        await db.execute({ sql: `DELETE FROM ${table} WHERE ${whereClauses.join(' AND ')}`, args })
      }
      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

  } catch (err: any) {
    console.error(`Dynamic API error [${table}]:`, err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }

  return null
}
```

### 2.24 Backend TypeScript Configs

**`functions/tsconfig.json`:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM"],
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "isolatedModules": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules"]
}
```

**`functions/cloudflare-env.d.ts`:**
```typescript
interface ExecutionContext {
  waitUntil(promise: Promise<any>): void
  passThroughOnException(): void
}
```

---

## SECTION 3: RULES — OBEY THESE UNCONDITIONALLY

### 3.1 Shell Rules

```
RULE S1: Each shell has its OWN HTML file, entry TSX, App component, and BrowserRouter.
RULE S2: Cross-shell navigation MUST use <a href="..."> or window.location.href. NEVER <Link>.
RULE S3: Shell HTML files contain ONLY: <meta>, <title>, <link>, <div id="root">, <script type="module">.
RULE S4: Each shell MUST have a unique <title> tag.
RULE S5: Each entry-point file does EXACTLY three things: import App, import CSS, call createRoot.
```

### 3.2 Feature Module Rules

```
RULE F1: Every feature gets its own directory under src/pages/{feature}/.
RULE F2: The main page component is named {Feature}Page.tsx.
RULE F3: Sub-components private to a feature live inside the feature directory.
RULE F4: Shared components go in src/components/shared/.
RULE F5: Shell-specific layout components go in src/components/{shell-name}/.
```

### 3.3 Backend Rules

```
RULE B1: Every handler function returns Promise<Response | null>. Return null if the route doesn't match.
RULE B2: The dynamic CRUD handler (/api/dynamic/{table}) is the LAST handler before 404.
RULE B3: Custom handlers go BEFORE the dynamic handler in the chain.
RULE B4: ALL table and column names MUST be validated with /^[a-zA-Z0-9_]+$/ before use in SQL.
RULE B5: ALL parameterized values MUST use ? placeholders. NEVER string concatenate user input into SQL.
RULE B6: The catch-all worker MUST pass through static file extensions AND Vite dev paths (/@*, /node_modules/*, /src/*).
RULE B7: The catch-all worker MUST end with return context.next() for non-API routes.
```

### 3.4 Styling Rules

```
RULE C1: Use CSS custom properties (--bg-main, --color-primary-rgb) as design tokens.
RULE C2: Map tokens in tailwind.config.js. NEVER hardcode hex colors in component classNames.
RULE C3: Themes are applied via CSS class on <html> (e.g., class="dark") and persisted in localStorage.
RULE C4: All shell entry points import the SAME index.css file.
```

### 3.5 Environment Variable Rules

```
RULE E1: Browser-safe values → frontend/.env with VITE_ prefix → accessed via import.meta.env.VITE_*
RULE E2: Backend secrets → .dev.vars (dev) / CF Dashboard (prod) → accessed via env.* in worker
RULE E3: NEVER put JWT_SECRET, DB tokens, or paid API keys in frontend/.env
```

### 3.6 Navigation Rules

```
RULE N1: Within same shell (e.g., /app/orders to /app/settings) → use React Router <Link> or useNavigate()
RULE N2: Between shells (e.g., /app to /auth) → use window.location.href or <a href>
RULE N3: After successful login → window.location.href = '/app' (triggers full page load, boots app shell)
RULE N4: On 401 response → localStorage.removeItem('auth_token'); window.location.href = '/auth'
```

---

## SECTION 4: DECISION TREES — WHEN YOU NEED TO MAKE A CHOICE

### 4.1 "How Many Shells Do I Need?"

```
START
│
├── Does the project have a public marketing/landing page?
│   └── YES → Shell: index.html
│
├── Does the project have login/registration?
│   └── YES → Shell: auth.html
│
├── Does the project have an authenticated user area?
│   └── YES → Shell: app.html
│
├── Does the project have an admin panel?
│   └── YES → Shell: admin.html
│
├── Does the project have a separate seller/instructor/creator dashboard?
│   └── YES → Shell: {role}.html (e.g., seller.html, teach.html)
│
└── RESULT: You need one shell for each YES answer.
    Minimum: 2 shells (auth + app). Maximum recommended: 5 shells.
```

### 4.2 "Should I Use Dynamic CRUD or a Custom Handler?"

```
START
│
├── Is it a simple SELECT/INSERT/UPDATE/DELETE on ONE table?
│   └── YES → Use /api/dynamic/{table}
│
├── Do I need JOINs across multiple tables?
│   └── YES → Write a custom handler
│
├── Do I need COUNT, SUM, GROUP BY, or aggregations?
│   └── YES → Write a custom handler
│
├── Do I need custom validation beyond type checking?
│   └── YES → Write a custom handler
│
├── Do I need a transaction (multiple queries that must all succeed)?
│   └── YES → Write a custom handler
│
└── When in doubt → Start with dynamic CRUD. Migrate to custom handler when needed.
```

### 4.3 "Where Does This Component Go?"

```
START — I'm creating a new component.
│
├── Is it used by ONLY ONE feature (e.g., only DashboardPage)?
│   └── YES → src/pages/{feature}/{ComponentName}.tsx
│
├── Is it used by ONLY ONE shell's layout (e.g., only the app sidebar)?
│   └── YES → src/components/{shell-name}/{ComponentName}.tsx
│       Examples: src/components/app/Sidebar.tsx
│                 src/components/landing/HeroSection.tsx
│
├── Is it used by MULTIPLE features or MULTIPLE shells?
│   └── YES → src/components/shared/{ComponentName}.tsx
│       Examples: src/components/shared/Modal.tsx
│                 src/components/shared/Button.tsx
│
└── Is it a context provider?
    └── YES → src/contexts/{ContextName}.tsx
```

### 4.4 "How Do I Add a New Feature?"

```
STEP 1: Create the page component
  → frontend/src/pages/{feature}/{Feature}Page.tsx

STEP 2: Create sub-components (if needed)
  → frontend/src/pages/{feature}/{SubComponent}.tsx

STEP 3: Add route in the appropriate App component
  → frontend/src/apps/MainApp.tsx
  → Add: <Route path="{feature}" element={<{Feature}Page />} />

STEP 4: Does this feature need custom backend logic?
  ├── NO → Use dynamic CRUD (/api/dynamic/{table})
  │   └── If new table → add to database/schema.sql
  │   └── Update OWNER_COLUMNS in dynamicHandler.ts if needed
  │
  └── YES → Create handler at functions/_api-core/api/{feature}/{Feature}Page.ts
      └── Register in _api-core/index.ts handler chain (BEFORE dynamic handler)

STEP 5: Add navigation link in Sidebar/AppLayout
```

### 4.5 "How Do I Add a New Shell?"

```
STEP 1: Create frontend/{shell}.html (copy from app.html, change <title> and <script src>)
STEP 2: Create frontend/src/entry-{shell}.tsx (copy from entry-app.tsx, change App import)
STEP 3: Create frontend/src/apps/{Shell}App.tsx (new BrowserRouter with shell-specific routes)
STEP 4: Add to vite.config.ts → rollupOptions.input: { ..., {shell}: './{shell}.html' }
STEP 5: Add to vite.config.ts → shell-rewrite-middleware rewrites: { '/{shell}': '/{shell}.html' }
STEP 6: Add to frontend/public/_redirects: /{shell}/* /{shell}.html 200 (BEFORE the /* catch-all)
STEP 7: Add to vite.config.ts → server.proxy if the shell needs API access
STEP 8: Add to tailwind.config.js → content array: "./{shell}.html"
```

---

## SECTION 5: TEMPLATES — COPY WHEN CREATING NEW FILES

### 5.1 New Feature Page Template

```tsx
// frontend/src/pages/{feature}/{Feature}Page.tsx
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { dynamicGet } from '../../utils/apiClient'

export const {Feature}Page = () => {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const rows = await dynamicGet('{table_name}', {
          order: 'created_at',
          dir: 'desc',
        })
        setData(rows)
      } catch (err) {
        console.error('Failed to fetch:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <h1 className="text-2xl font-bold">{Feature}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((item: any) => (
          <div key={item.id} className="glass-card rounded-xl p-4">
            <h3 className="font-semibold">{item.name || item.title}</h3>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
```

### 5.2 New Custom Handler Template

```typescript
// functions/_api-core/api/{feature}/{Feature}Page.ts
import { verifyToken, corsHeaders } from '../../utils'
import type { Env } from '../../index'

export async function handle{Feature}Route(
  url: URL,
  request: Request,
  db: any,
  env: Env
): Promise<Response | null> {
  // Route matching — return null if not our route
  if (!url.pathname.startsWith('/api/{feature}')) return null

  // Auth
  const payload = await verifyToken(request, env.JWT_SECRET || 'fallback')
  if (!payload) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: corsHeaders
    })
  }

  try {
    // GET /api/{feature}/data
    if (url.pathname === '/api/{feature}/data' && request.method === 'GET') {
      const result = await db.execute({
        sql: "SELECT * FROM {table} WHERE user_id = ? ORDER BY created_at DESC",
        args: [payload.userId]
      })
      return new Response(JSON.stringify({ success: true, data: result.rows }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    // POST /api/{feature}/create
    if (url.pathname === '/api/{feature}/create' && request.method === 'POST') {
      const body = await request.json() as any
      const id = crypto.randomUUID()
      await db.execute({
        sql: "INSERT INTO {table} (id, user_id, name) VALUES (?, ?, ?)",
        args: [id, payload.userId, body.name]
      })
      return new Response(JSON.stringify({ success: true, data: { id, ...body } }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }

  return null
}
```

### 5.3 Database Schema Template

```sql
-- database/schema.sql

-- Always start with users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    avatar_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Template for feature tables:
-- CREATE TABLE IF NOT EXISTS {table_name} (
--     id TEXT PRIMARY KEY,
--     user_id TEXT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
--     {your columns here}
--     created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
--     updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
-- );
-- CREATE INDEX IF NOT EXISTS idx_{table_name}_user ON {table_name}(user_id);
```

---

## SECTION 6: VALIDATION CHECKLIST — VERIFY YOUR OUTPUT

After generating or modifying the project, verify ALL of these:

```
[ ] Every shell HTML has a unique <title>
[ ] Every shell HTML has exactly one <script type="module"> pointing to a unique entry-{shell}.tsx
[ ] Every entry-{shell}.tsx imports ONLY: its App component, index.css, React, ReactDOM
[ ] Every {Shell}App.tsx creates its OWN <BrowserRouter>
[ ] vite.config.ts rollupOptions.input lists ALL shell HTML files
[ ] vite.config.ts rewrite middleware handles ALL non-index shells
[ ] _redirects lists ALL shells with specific rules BEFORE the /* catch-all
[ ] [[route]].ts passes through static extensions AND Vite dev paths
[ ] [[route]].ts forwards /api and /auth/ to the worker
[ ] [[route]].ts ends with return context.next()
[ ] _api-core/index.ts tries handlers in order, dynamic handler LAST before 404
[ ] dynamicHandler.ts validates table names with /^[a-zA-Z0-9_]+$/
[ ] dynamicHandler.ts validates column names with /^[a-zA-Z0-9_]+$/
[ ] dynamicHandler.ts uses parameterized queries (? placeholders, never string concat)
[ ] Cross-shell navigation uses <a href> or window.location.href, NEVER <Link>
[ ] No component in pages/{feature}/ is imported by a different feature
[ ] No component in components/app/ is imported by IndexApp or AuthApp
[ ] .gitignore excludes .dev.vars and .env
[ ] CSS uses custom properties, Tailwind config maps them, components use Tailwind classes
[ ] All font imports are in the shell HTML <head>, not in CSS or JS
```

---

## SECTION 7: COMMON AI MISTAKES — AVOID THESE

```
MISTAKE 1: Creating a single App.tsx with all routes instead of separate shells.
FIX: Each shell has its own {Shell}App.tsx with its own BrowserRouter.

MISTAKE 2: Using <Link to="/auth"> to navigate between shells.
FIX: Use <a href="/auth"> or window.location.href = '/auth'.

MISTAKE 3: Putting the Sidebar component inside IndexApp or AuthApp.
FIX: Sidebar belongs in components/app/ and is only used by MainApp via AppLayout.

MISTAKE 4: Forgetting the shell-rewrite-middleware in vite.config.ts.
FIX: Without it, /app/orders returns a 404 in development. The middleware rewrites it to /app.html.

MISTAKE 5: Putting _redirects in the project root instead of frontend/public/.
FIX: _redirects must be in frontend/public/ so Vite copies it to dist/ during build.

MISTAKE 6: Adding the dynamic handler BEFORE custom handlers in the chain.
FIX: Dynamic handler is always the LAST handler before 404. Custom handlers go first.

MISTAKE 7: Forgetting to pass through /@* and /node_modules/* in [[route]].ts.
FIX: These are Vite HMR paths. If blocked, hot reload and module loading break in dev.

MISTAKE 8: Using Express, Hono, or itty-router in the worker.
FIX: The pattern uses NO framework. Each handler is a pure function that returns Response | null.

MISTAKE 9: Sharing React context between shells.
FIX: Shells share state via localStorage only. Each shell mounts its own provider tree.

MISTAKE 10: Hardcoding colors like bg-[#0b1121] instead of using design tokens.
FIX: Use bg-background, text-primary, border-white/10 — tokens that adapt to themes.

MISTAKE 11: Creating one massive component file instead of a feature directory.
FIX: Each feature gets a directory: pages/{feature}/{Feature}Page.tsx + sub-components.

MISTAKE 12: String concatenating user input into SQL queries.
FIX: ALWAYS use parameterized queries: { sql: "SELECT * FROM t WHERE id = ?", args: [id] }
```

---

> **This document contains every file, every rule, and every decision tree an AI tool needs to build a multilithic application correctly.** Feed it as context, reference it as a system prompt, or include it in your project's `Docs/` folder for any AI tool to find.
