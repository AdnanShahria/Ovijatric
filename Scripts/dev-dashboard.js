const { spawn, execSync } = require('child_process');
const os = require('os');
const path = require('path');

// ─── ANSI Color Palette (Dark Elegant Theme) ────────────────────────────
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  // Foreground
  fg: {
    white:   '\x1b[97m',
    gray:    '\x1b[90m',
    green:   '\x1b[38;5;114m',
    blue:    '\x1b[38;5;111m',
    cyan:    '\x1b[38;5;80m',
    magenta: '\x1b[38;5;176m',
    yellow:  '\x1b[38;5;222m',
    red:     '\x1b[38;5;203m',
    orange:  '\x1b[38;5;209m',
    teal:    '\x1b[38;5;73m',
  },
  // Background
  bg: {
    red:     '\x1b[48;5;52m',
    green:   '\x1b[48;5;22m',
    blue:    '\x1b[48;5;17m',
  }
};

// ─── State ───────────────────────────────────────────────────────────────
const startTime = Date.now();
const MAX_LOGS = 10;
let logs = [];
let renderTimer = null;
let isShuttingDown = false;

const services = {
  vite: {
    name: 'Vite Frontend',
    status: 'STARTING',
    pid: null,
    port: '5173',
    logCount: 0,
    icon: '◈',
    color: C.fg.cyan,
  },
  wrangler: {
    name: 'Wrangler Backend',
    status: 'STARTING',
    pid: null,
    port: '8788',
    logCount: 0,
    icon: '◈',
    color: C.fg.magenta,
  }
};

let viteProcess = null;
let wranglerProcess = null;

// ─── API Analytics ───────────────────────────────────────────────────────
const apiStats = {};
const apiTimeline = {};
const apiHistory = [];
const MAX_API_HISTORY = 5;
let recentCallTimestamps = [];

const MALICIOUS_PATTERNS = ['.env', 'wp-admin', 'wp-login', '.git', 'config.json', 'phpinfo', 'eval(', '<script', '..%2f', 'passwd'];

function detectThreat(reqPath) {
  const lower = reqPath.toLowerCase();
  for (const pattern of MALICIOUS_PATTERNS) {
    if (lower.includes(pattern)) return `BLOCKED: ${pattern}`;
  }
  // Rate-based spam detection
  const now = Date.now();
  recentCallTimestamps.push(now);
  recentCallTimestamps = recentCallTimestamps.filter(t => now - t < 2000);
  if (recentCallTimestamps.length > 20) return `SPAM: ${recentCallTimestamps.length} req/2s`;
  return null;
}

function trackApiCall(method, reqPath) {
  const minuteKey = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  apiTimeline[minuteKey] = (apiTimeline[minuteKey] || 0) + 1;
  apiStats[reqPath] = (apiStats[reqPath] || 0) + 1;
  const threat = detectThreat(reqPath);
  const timeStr = new Date().toLocaleTimeString();
  apiHistory.push({ time: timeStr, method, path: reqPath, threat });
  if (apiHistory.length > MAX_API_HISTORY) apiHistory.shift();
}

// ─── Logging ─────────────────────────────────────────────────────────────
function addLog(service, message) {
  const line = message.trim();
  if (!line) return;

  // Extract HTTP request info from Wrangler/Vite logs
  const httpMatch = line.match(/\b(GET|POST|PUT|DELETE|PATCH|OPTIONS|HEAD)\s+(\/\S*)/);
  if (httpMatch) {
    trackApiCall(httpMatch[1], httpMatch[2]);
  }

  const ts = new Date().toLocaleTimeString();
  logs.push({ ts, service: service.name, color: service.color, line });
  if (logs.length > MAX_LOGS) logs.shift();
  service.logCount++;
  scheduleRender();
}

// ─── Rendering (single atomic write) ────────────────────────────────────
let pendingRender = false;
function scheduleRender() {
  if (pendingRender) return;
  pendingRender = true;
  setImmediate(() => {
    pendingRender = false;
    render();
  });
}

function pad(str, len) {
  // Strip ANSI for length calculation
  const visible = str.replace(/\x1b\[[0-9;]*m/g, '');
  if (visible.length >= len) return str;
  return str + ' '.repeat(len - visible.length);
}

function render() {
  if (isShuttingDown) return;

  const W = process.stdout.columns || 90;
  const hr = '─'.repeat(W);
  const dhr = '═'.repeat(W);
  const R = C.reset;
  const B = C.bold;
  const D = C.dim;

  const lines = [];
  const push = (s = '') => lines.push(s);

  // ── Header
  push(`${B}${C.fg.teal}${dhr}${R}`);
  const title = 'O V I J A T R I K   D E V   S T A C K';
  const padL = Math.max(0, Math.floor((W - title.length) / 2));
  push(`${B}${C.fg.teal}${' '.repeat(padL)}${title}${R}`);
  push(`${B}${C.fg.teal}${dhr}${R}`);

  // ── Services
  push(`${B}${C.fg.white}  SERVICES${R}`);
  push(`  ${D}${hr}${R}`);
  for (const key of Object.keys(services)) {
    const s = services[key];
    let statusBadge;
    if (s.status === 'RUNNING') {
      statusBadge = `${C.bg.green}${B}${C.fg.white} RUNNING ${R}`;
    } else if (s.status === 'STARTING') {
      statusBadge = `${C.fg.yellow}${B} WAIT... ${R}`;
    } else {
      statusBadge = `${C.bg.red}${B}${C.fg.white} STOPPED ${R}`;
    }
    const pidStr = s.pid ? `PID ${s.pid}` : '---';
    push(`  ${s.color}${s.icon} ${B}${s.name}${R}  ${statusBadge}  ${D}${pidStr}  │  :${s.port}  │  ${s.logCount} logs${R}`);
  }

  // ── API Insights
  push('');
  push(`${B}${C.fg.white}  API INSIGHTS${R}`);
  push(`  ${D}${hr}${R}`);

  const tlEntries = Object.entries(apiTimeline).slice(-5);
  if (tlEntries.length) {
    const bar = tlEntries.map(([t, n]) => `${D}${t}${R} ${C.fg.cyan}${n}${R}`).join('  │  ');
    push(`  ${D}Timeline:${R}  ${bar}`);
  } else {
    push(`  ${D}No API traffic recorded yet${R}`);
  }

  const topApis = Object.entries(apiStats).sort((a, b) => b[1] - a[1]).slice(0, 4);
  if (topApis.length) {
    const bar = topApis.map(([p, n]) => `${C.fg.yellow}${p}${R} ${D}×${n}${R}`).join('  │  ');
    push(`  ${D}Top:${R}      ${bar}`);
  }

  // ── Recent Requests
  push('');
  push(`${B}${C.fg.white}  RECENT REQUESTS${R}`);
  push(`  ${D}${hr}${R}`);
  if (apiHistory.length === 0) {
    push(`  ${D}Waiting for incoming requests...${R}`);
  } else {
    for (const req of apiHistory) {
      const tag = req.threat
        ? `${C.bg.red}${B}${C.fg.white} ⚠ ${req.threat} ${R}`
        : `${C.fg.green}✓${R}`;
      push(`  ${D}${req.time}${R}  ${tag}  ${B}${req.method}${R} ${req.path}`);
    }
  }

  // ── System
  push('');
  const secs = Math.floor((Date.now() - startTime) / 1000);
  const upH = String(Math.floor(secs / 3600)).padStart(2, '0');
  const upM = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
  const upS = String(secs % 60).padStart(2, '0');
  const freeMem = (os.freemem() / 1073741824).toFixed(1);
  const totalMem = (os.totalmem() / 1073741824).toFixed(1);
  push(`  ${D}Uptime ${R}${upH}:${upM}:${upS}  ${D}│  RAM ${R}${freeMem}/${totalMem} GB  ${D}│  ${R}${os.platform()} ${os.release()}`);
  push(`${B}${C.fg.teal}${dhr}${R}`);

  // ── Logs
  push('');
  push(`${B}${C.fg.white}  SYSTEM LOGS${R}`);
  push(`  ${D}${hr}${R}`);
  if (logs.length === 0) {
    push(`  ${D}Waiting for output...${R}`);
  } else {
    for (const entry of logs) {
      const src = `${entry.color}${entry.service}${R}`;
      push(`  ${D}${entry.ts}${R}  ${src}  ${entry.line}`);
    }
  }
  push(`  ${D}${hr}${R}`);
  push(`  ${C.fg.red}${B}Ctrl+C${R}${D} to stop all services${R}`);

  // ── Atomic write: clear + draw in one call
  const output = '\x1Bc' + lines.join('\n') + '\n';
  process.stdout.write(output);
}

// ── Timed re-render for uptime counter (every 5s to reduce flicker)
renderTimer = setInterval(scheduleRender, 5000);

// ─── Process Management ─────────────────────────────────────────────────
function startService(key) {
  const svc = services[key];
  const isVite = key === 'vite';

  const cmd = isVite ? 'npm' : 'npx';
  const args = isVite
    ? ['run', 'dev', '--workspace=frontend']
    : ['wrangler', 'pages', 'dev', 'frontend/public', '--port', '8788', '--compatibility-flag=nodejs_compat'];

  const child = spawn(cmd, args, {
    cwd: path.resolve(__dirname, '..'),
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
    windowsHide: true,
  });

  svc.pid = child.pid;
  svc.status = 'RUNNING';

  child.stdout.on('data', d => {
    d.toString().split('\n').forEach(l => { if (l.trim()) addLog(svc, l); });
  });
  child.stderr.on('data', d => {
    d.toString().split('\n').forEach(l => { if (l.trim()) addLog(svc, l); });
  });
  child.on('close', code => {
    svc.status = 'STOPPED';
    svc.pid = null;
    if (!isShuttingDown) addLog(svc, `Exited (code ${code})`);
  });

  return child;
}

viteProcess = startService('vite');
wranglerProcess = startService('wrangler');

// Initial render
render();

// ─── Graceful Shutdown ──────────────────────────────────────────────────
function shutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  clearInterval(renderTimer);

  process.stdout.write('\x1Bc');
  console.log(`\n${C.bold}${C.fg.yellow}  Shutting down...${C.reset}\n`);

  const kill = (child) => {
    if (!child || child.killed) return;
    try {
      if (process.platform === 'win32') {
        execSync(`taskkill /pid ${child.pid} /f /t`, { stdio: 'ignore' });
      } else {
        child.kill('SIGTERM');
      }
    } catch (_) { /* already dead */ }
  };

  kill(viteProcess);
  kill(wranglerProcess);

  setTimeout(() => {
    console.log(`${C.bold}${C.fg.green}  All services stopped.${C.reset}\n`);
    process.exit(0);
  }, 800);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('exit', () => { isShuttingDown = true; });
