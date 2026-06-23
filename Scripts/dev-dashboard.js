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
    white: '\x1b[97m',
    gray: '\x1b[90m',
    green: '\x1b[38;5;114m',
    blue: '\x1b[38;5;111m',
    cyan: '\x1b[38;5;80m',
    magenta: '\x1b[38;5;176m',
    yellow: '\x1b[38;5;222m',
    red: '\x1b[38;5;203m',
    orange: '\x1b[38;5;209m',
    teal: '\x1b[38;5;73m',
  },
  // Background
  bg: {
    red: '\x1b[48;5;52m',
    green: '\x1b[48;5;22m',
    blue: '\x1b[48;5;17m',
  }
};

// ─── State ───────────────────────────────────────────────────────────────
const startTime = Date.now();
const MAX_LOGS = 50; // Increased to allow more logs when terminal size permits
let logs = [];
let renderTimer = null;
let isShuttingDown = false;
let lastLines = [];

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
const MAX_API_HISTORY = 20; // Increased to allow more history when terminal size permits
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
let renderTimeout = null;
let lastRenderTime = 0;
const RENDER_THROTTLE_MS = 100; // Render at most 10 times per second during log bursts

function scheduleRender() {
  if (isShuttingDown) return;
  if (renderTimeout) return;

  const now = Date.now();
  const timeSinceLastRender = now - lastRenderTime;

  if (timeSinceLastRender >= RENDER_THROTTLE_MS) {
    renderTimeout = setImmediate(() => {
      renderTimeout = null;
      lastRenderTime = Date.now();
      render();
    });
  } else {
    renderTimeout = setTimeout(() => {
      renderTimeout = null;
      lastRenderTime = Date.now();
      render();
    }, RENDER_THROTTLE_MS - timeSinceLastRender);
  }
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
  const H = process.stdout.rows || 30;
  const hr = '─'.repeat(W);
  const dhr = '═'.repeat(W);
  const R = C.reset;
  const B = C.bold;
  const D = C.dim;

  const lines = [];

  // 1. Header
  const title = 'O V I J A T R I K   D E V   S T A C K';
  const padL = Math.max(0, Math.floor((W - title.length) / 2));
  lines.push(`${B}${C.fg.teal}${dhr}${R}`);
  lines.push(`${B}${C.fg.teal}${' '.repeat(padL)}${title}${R}`);
  lines.push(`${B}${C.fg.teal}${dhr}${R}`);

  // 2. Services
  lines.push(`${B}${C.fg.white}  SERVICES${R}`);
  lines.push(`  ${D}${hr}${R}`);
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
    lines.push(`  ${s.color}${s.icon} ${B}${s.name}${R}  ${statusBadge}  ${D}${pidStr}  │  :${s.port}  │  ${s.logCount} logs${R}`);
  }

  // 3. API Insights (optional: only if we have traffic or history)
  const tlEntries = Object.entries(apiTimeline).slice(-5);
  const topApis = Object.entries(apiStats).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const hasInsights = tlEntries.length > 0 || topApis.length > 0;
  
  const insightLines = [];
  if (hasInsights) {
    insightLines.push('');
    insightLines.push(`${B}${C.fg.white}  API INSIGHTS${R}`);
    insightLines.push(`  ${D}${hr}${R}`);
    if (tlEntries.length) {
      const bar = tlEntries.map(([t, n]) => `${D}${t}${R} ${C.fg.cyan}${n}${R}`).join('  │  ');
      insightLines.push(`  ${D}Timeline:${R}  ${bar}`);
    } else {
      insightLines.push(`  ${D}No API traffic recorded yet${R}`);
    }
    if (topApis.length) {
      const bar = topApis.map(([p, n]) => `${C.fg.yellow}${p}${R} ${D}×${n}${R}`).join('  │  ');
      insightLines.push(`  ${D}Top:${R}      ${bar}`);
    }
  }

  // 4. System Uptime/RAM
  const secs = Math.floor((Date.now() - startTime) / 1000);
  const upH = String(Math.floor(secs / 3600)).padStart(2, '0');
  const upM = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
  const upS = String(secs % 60).padStart(2, '0');
  const freeMem = (os.freemem() / 1073741824).toFixed(1);
  const totalMem = (os.totalmem() / 1073741824).toFixed(1);
  const systemLines = [
    '',
    `  ${D}Uptime ${R}${upH}:${upM}:${upS}  ${D}│  RAM ${R}${freeMem}/${totalMem} GB  ${D}│  ${R}${os.platform()} ${os.release()}`,
    `${B}${C.fg.teal}${dhr}${R}`
  ];

  // 5. Footer
  const footerLines = [
    `  ${D}${hr}${R}`,
    `  ${C.fg.red}${B}Ctrl+C${R}${D} to stop all services${R}`
  ];

  // Calculate dynamic heights to fit H
  // Fixed lines = Header (3) + Services (4) + Insights (insightLines.length) + System (3) + Footer (2)
  // + 3 lines for Requests header and 3 lines for Logs header
  const fixedCount = 18 + insightLines.length;
  const remaining = H - fixedCount - 2; // leave margin

  let allowedRequests = 0;
  let allowedLogs = 0;

  if (remaining > 0) {
    allowedRequests = Math.min(MAX_API_HISTORY, Math.max(1, Math.floor(remaining * 0.35)));
    allowedLogs = Math.max(1, remaining - allowedRequests);
  }

  const requestsToShow = allowedRequests > 0 ? apiHistory.slice(-allowedRequests) : [];
  const logsToShow = allowedLogs > 0 ? logs.slice(-allowedLogs) : [];

  // Now build the full lines array
  lines.push('');
  lines.push(`${B}${C.fg.white}  RECENT REQUESTS${R}`);
  lines.push(`  ${D}${hr}${R}`);
  if (requestsToShow.length === 0) {
    lines.push(`  ${D}Waiting for incoming requests...${R}`);
  } else {
    for (const req of requestsToShow) {
      const tag = req.threat
        ? `${C.bg.red}${B}${C.fg.white} ⚠ ${req.threat} ${R}`
        : `${C.fg.green}✓${R}`;
      lines.push(`  ${D}${req.time}${R}  ${tag}  ${B}${req.method}${R} ${req.path}`);
    }
  }

  if (hasInsights) {
    lines.push(...insightLines);
  }

  lines.push(...systemLines);

  lines.push('');
  lines.push(`${B}${C.fg.white}  SYSTEM LOGS${R}`);
  lines.push(`  ${D}${hr}${R}`);
  if (logsToShow.length === 0) {
    lines.push(`  ${D}Waiting for output...${R}`);
  } else {
    for (const entry of logsToShow) {
      const src = `${entry.color}${entry.service}${R}`;
      lines.push(`  ${D}${entry.ts}${R}  ${src}  ${entry.line}`);
    }
  }

  lines.push(...footerLines);

  // Crop to window height - 1 to prevent scrolling/splits
  const currentLines = lines.slice(0, H - 1);

  // Diff-based terminal draw: only write lines that changed
  let writeBuffer = '';
  const maxLines = Math.max(currentLines.length, lastLines.length);

  for (let i = 0; i < maxLines; i++) {
    if (i >= currentLines.length) {
      // Clear line
      writeBuffer += `\x1b[${i + 1};1H\x1b[K`;
    } else if (i >= lastLines.length || currentLines[i] !== lastLines[i]) {
      // Write line and clear rest of line
      writeBuffer += `\x1b[${i + 1};1H${currentLines[i]}\x1b[K`;
    }
  }

  if (writeBuffer) {
    process.stdout.write(writeBuffer);
  }

  lastLines = currentLines;
}

// ── Timed re-render for uptime counter (every 1s in realtime)
renderTimer = setInterval(scheduleRender, 1000);

// ── Terminal resize event handler
process.stdout.on('resize', () => {
  lastLines = [];
  process.stdout.write('\x1b[2J');
  scheduleRender();
});

// ─── Process Management ─────────────────────────────────────────────────
function startService(key) {
  const svc = services[key];
  const isVite = key === 'vite';

  const baseCmd = isVite ? 'npm' : 'npx';
  const args = isVite
    ? ['run', 'dev', '--workspace=frontend']
    : ['wrangler', 'pages', 'dev', 'frontend/public', '--port', '8788', '--compatibility-flag=nodejs_compat'];

  const child = spawn(`${baseCmd} ${args.join(' ')}`, [], {
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

// Hide cursor at startup and clear screen
process.stdout.write('\x1b[?25l\x1b[2J\x1b[3J\x1b[H');

// Initial render
render();

// ─── Graceful Shutdown ──────────────────────────────────────────────────
function shutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  clearInterval(renderTimer);

  // Restore cursor and clear screen
  process.stdout.write('\x1b[?25h\x1Bc');
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
process.on('exit', () => {
  isShuttingDown = true;
  process.stdout.write('\x1b[?25h');
});
