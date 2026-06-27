import app from './app';
import { env } from './config/env';
import logger from './config/logger';

const server = app.listen(env.PORT, () => {
  logger.info(`⚡️ Server is running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception! Shutting down... Details: %o', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection! Shutting down... Details: %o', reason);
  server.close(() => {
    process.exit(1);
  });
});
