export function log(level, message, data = undefined) {
  const entry = { ts: new Date().toISOString(), level, message };
  if (data !== undefined) entry.data = data;
  console.log(JSON.stringify(entry));
}

export const logger = {
  info: (message, data) => log('info', message, data),
  warn: (message, data) => log('warn', message, data),
  error: (message, data) => log('error', message, data)
};
