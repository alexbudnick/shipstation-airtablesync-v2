function safeJson(data) {
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

export function log(level, message, data = undefined) {
  const prefix = `[${new Date().toISOString()}] [${level}] ${message}`;
  const line = data === undefined ? prefix : `${prefix}\n${safeJson(data)}`;
  if (level === 'error') console.error(line);
  else console.log(line);
}

export const logger = {
  info: (message, data) => log('info', message, data),
  warn: (message, data) => log('warn', message, data),
  error: (message, data) => log('error', message, data)
};
