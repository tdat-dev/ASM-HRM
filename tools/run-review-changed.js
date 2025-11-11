#!/usr/bin/env node
/**
 * Parallel review runner for changed files (diff against base).
 * - Detects changed files via `git diff --name-only <base>...HEAD`
 * - Filters by extensions
 * - Runs `node review.js --file "<path>"` in parallel with a concurrency limit
 * - Summarizes successes/failures and exits non-zero on any failure
 *
 * Usage:
 *   node tools/run-review-changed.js            # base = origin/main by default
 *   node tools/run-review-changed.js origin/dev # custom base
 *
 * Requirements:
 * - Node 16+
 * - review.js at project root that supports a `--file` argument (recommended)
 */

const { spawnSync, spawn } = require('child_process');
const { EOL } = require('os');
const path = require('path');

const exts = /\.(js|mjs|cjs|ts|tsx|css|php|html)$/i;
const BASE = process.argv[2] || process.env.REVIEW_BASE || 'origin/main';
const CONCURRENCY = Number(process.env.REVIEW_CONCURRENCY || 6);
const REVIEW_CMD = process.env.REVIEW_CMD || 'node';
const REVIEW_ARGS = (process.env.REVIEW_ARGS || 'review.js').split(/\s+/).filter(Boolean);

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts });
  if (res.status !== 0) {
    return { ok: false, stdout: res.stdout || '', stderr: res.stderr || '' };
  }
  return { ok: true, stdout: res.stdout || '', stderr: res.stderr || '' };
}

function getChangedFiles(base) {
  // Ensure fetch
  run('git', ['fetch', 'origin', '--quiet']);
  // List changed files vs base
  const diff = run('git', ['diff', '--name-only', `${base}...HEAD`]);
  if (!diff.ok) {
    // fallback to last commit
    const fallback = run('git', ['diff', '--name-only', 'HEAD~1...HEAD']);
    if (!fallback.ok) {
      console.error('[review] Cannot determine changed files:', diff.stderr || fallback.stderr);
      process.exit(2);
    }
    return fallback.stdout.split(/\r?\n/).filter(Boolean);
  }
  return diff.stdout.split(/\r?\n/).filter(Boolean);
}

async function runPool(files, limit) {
  const queue = files.slice();
  let running = 0;
  let resolved = 0;
  const results = [];

  function startNext(resolve) {
    if (queue.length === 0) {
      if (running === 0) resolve();
      return;
    }
    if (running >= limit) return;

    const file = queue.shift();
    running++;
    const child = spawn(REVIEW_CMD, [...REVIEW_ARGS, '--file', file], {
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
    child.on('exit', (code) => {
      running--;
      results.push({ file, ok: code === 0 });
      resolved++;
      startNext(resolve);
      // Try to fill more slots
      while (running < limit && queue.length > 0) {
        startNext(resolve);
      }
    });
  }

  await new Promise((resolve) => {
    const slots = Math.min(limit, files.length);
    for (let i = 0; i < slots; i++) startNext(resolve);
    if (files.length === 0) resolve();
  });
  return results;
}

(async function main() {
  const all = getChangedFiles(BASE).filter((f) => exts.test(f));
  if (all.length === 0) {
    console.log('[review] No changed files to review.');
    process.exit(0);
  }
  console.log(`[review] Base: ${BASE}`);
  console.log(`[review] Files to review (${all.length}):`);
  console.log(all.map((f) => `  - ${f}`).join(EOL));
  console.log(`[review] Concurrency: ${CONCURRENCY}`);

  const results = await runPool(all, CONCURRENCY);
  const failed = results.filter((r) => !r.ok);
  if (failed.length > 0) {
    console.error(`[review] Failed files (${failed.length}):`);
    failed.forEach((r) => console.error(`  - ${r.file}`));
    process.exit(1);
  }
  console.log('[review] All reviews passed.');
  process.exit(0);
})();


