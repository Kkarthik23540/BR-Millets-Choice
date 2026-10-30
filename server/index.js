import app from './app.js';
import { config, emailConfigured } from './config.js';
import { pool } from './db.js';
import { startEmailWorker } from './email.js';

let stopEmailWorker = () => {};
let server;

if (!process.env.VERCEL) {
  stopEmailWorker = startEmailWorker();
  server = app.listen(config.port, () => {
    console.log(`BR Millet Choice server listening on port ${config.port} (${config.nodeEnv})`);
    if (!emailConfigured) console.warn('Email is not configured; account verification and transactional email need SMTP settings.');
    if (config.paymentProvider !== 'disabled') console.warn('Online payment provider is not implemented; checkout continues to disable online payments.');
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ ERROR: Port ${config.port} is already in use by another process.`);
      console.error(`👉 Solution: Stop the existing process using port ${config.port}, or set PORT=3001 in your .env file.`);
      console.error(`👉 On Windows CMD, you can free the port by running:`);
      console.error(`   netstat -ano | findstr :${config.port}`);
      console.error(`   taskkill /F /PID <PID>\n`);
      process.exit(1);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });

  async function shutdown(signal) {
    console.log(`Received ${signal}; shutting down.`);
    stopEmailWorker();
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

export default app;
