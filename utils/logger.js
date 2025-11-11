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

const MIN_LEVEL = (() => {
  // Simple env-based level control; default to "warn"
  const fromEnv =
    (typeof window !== "undefined" &&
      (window.LOG_LEVEL || window.APP_LOG_LEVEL)) ||
    (typeof process !== "undefined" && process.env && process.env.LOG_LEVEL) ||
    "warn";
  const order = ["debug", "info", "warn", "error"];
  return order.includes(fromEnv) ? fromEnv : "warn";
})();

function shouldLog(level) {
  const order = { debug: 10, info: 20, warn: 30, error: 40 };
  return order[level] >= order[MIN_LEVEL];
}

function toSerializable(details) {
  // Extract useful info from Error instances
  if (details instanceof Error) {
    return { message: details.message, stack: details.stack };
  }
  if (details && typeof details === "object") {
    const out = {};
    for (const [k, v] of Object.entries(details)) {
      if (v instanceof Error) {
        out[k] = { message: v.message, stack: v.stack };
      } else {
        out[k] = v;
      }
    }
    return out;
  }
  return details;
}

function emit(level, event, details) {
  if (!shouldLog(level)) return;
  const payload = {
    ts: nowIso(),
    level,
    event,
    ...toSerializable(details),
  };
  let line = "";
  try {
    line = JSON.stringify(payload);
  } catch (e) {
    // Fallback to minimal line if serialization fails
    line = JSON.stringify({
      ts: payload.ts,
      level: payload.level,
      event: payload.event,
      message: "log_serialize_failed",
    });
  }
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


