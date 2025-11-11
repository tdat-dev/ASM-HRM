#!/usr/bin/env node
/**
 * Fast prefilter for risky changes (XSS, eval, inline events, dangerous sinks).
 * It scans only changed files and prints a shortlist for deep review.
 *
 * Usage:
 *   node tools/fast-review.js                 # base = origin/main
 *   node tools/fast-review.js origin/dev      # custom base
 *
 * Optional: run full review only for risky files
 *   REVIEW_RUN_FULL=1 node tools/fast-review.js
 */
const { spawnSync, spawn } = require('child_process');

const BASE = process.argv[2] || process.env.REVIEW_BASE || 'origin/main';
const RUN_FULL = process.env.REVIEW_RUN_FULL === '1';
const exts = /\.(js|mjs|cjs|ts|tsx|css|php|html)$/i;

const riskyPatterns = [
  /innerHTML\s*=/,
  /insertAdjacentHTML\s*\(/,
  /on[a-z]+\s*=/, // inline events like onclick=
  /\beval\s*\(/,
  /new\s+Function\s*\(/,
  /document\.write\s*\(/,
  /src=["'`]?\s*\$\{/,
  /localStorage\.getItem\(/, // often paired with direct JSON.parse
];

function run(cmd, args) {
  return spawnSync(cmd, args, { encoding: 'utf8' });
}

function getChangedFiles(base) {
  run('git', ['fetch', 'origin', '--quiet']);
  const r = run('git', ['diff', '--name-only', `${base}...HEAD`]);
  if (r.status !== 0) {
    const f = run('git', ['diff', '--name-only', 'HEAD~1...HEAD']);
    if (f.status !== 0) {
      console.error('[fast-review] Cannot list changed files.');
      process.exit(2);
    }
    return f.stdout.split(/\r?\n/).filter(Boolean);
  }
  return r.stdout.split(/\r?\n/).filter(Boolean);
}

function fileContent(path) {
  const r = run('git', ['show', `HEAD:${path}`]);
  if (r.status !== 0) {
    // Try reading from working tree as fallback (new files, etc.)
    const fs = require('fs');
    try {
      return fs.readFileSync(path, 'utf8');
    } catch {
      return '';
    }
  }
  return r.stdout || '';
}

const files = getChangedFiles(BASE).filter((f) => exts.test(f));
if (files.length === 0) {
  console.log('[fast-review] No changed files to scan.');
  process.exit(0);
}

const risky = [];
for (const f of files) {
  const text = fileContent(f);
  if (!text) continue;
  if (riskyPatterns.some((re) => re.test(text))) {
    risky.push(f);
  }
}

if (risky.length === 0) {
  console.log('[fast-review] No risky patterns detected in changed files.');
  process.exit(0);
}

console.log('[fast-review] Risky files detected:');
for (const f of risky) console.log(`  - ${f}`);

if (RUN_FULL) {
  console.log('[fast-review] Running full review only on risky files...');
  for (const f of risky) {
    const child = spawn('node', ['review.js', '--file', f], {
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
    child.on('exit', (code) => {
      if (code !== 0) process.exit(code);
    });
  }
}


