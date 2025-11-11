// Simple structured logger with minimal footprint
// - Avoids console.log in production; uses console.error/warn for important issues
// - All messages are structured for easier parsing/aggregation
const LEVELS = { error: "error", warn: "warn", info: "info", debug: "debug" };

function nowIso() {
  try {
    return new Date().toISOString();
  } catch {
    return "";
  }
}

function emit(level, event, details) {
  const payload = {
    ts: nowIso(),
    level,
    event,
    ...details,
  };
  const line = JSON.stringify(payload);
  if (level === LEVELS.error) {
    console.error(line);
  } else if (level === LEVELS.warn) {
    console.warn(line);
  } else {
    // For info/debug, keep silent by default to avoid noise
  }
}

export const logger = {
  error(event, details = {}) {
    emit(LEVELS.error, event, details);
  },
  warn(event, details = {}) {
    emit(LEVELS.warn, event, details);
  },
  info(event, details = {}) {
    emit(LEVELS.info, event, details);
  },
  debug(event, details = {}) {
    emit(LEVELS.debug, event, details);
  },
};


