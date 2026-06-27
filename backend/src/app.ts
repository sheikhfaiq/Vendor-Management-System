import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import logger from './config/logger';
import { errorHandler } from './middleware/error.middleware';

// Import routes
import authRoutes from './modules/auth/auth.routes';
import serviceRoutes from './modules/service/service.routes';
import vendorRoutes from './modules/vendor/vendor.routes';
import adminRoutes from './modules/admin/admin.routes';

const app = express();

// Security and utility middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Morgan request logger integrated with Winston
app.use(
  morgan(':remote-addr - :method :url :status :response-time ms - :res[content-length]', {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Mount modules
app.use('/auth', authRoutes);
app.use('/services', serviceRoutes);
app.use('/vendors', vendorRoutes);
app.use('/admin', adminRoutes);

// Global centralized error handler
app.use(errorHandler as any);

export default app;
