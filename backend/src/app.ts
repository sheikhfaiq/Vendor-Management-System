import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import logger from './config/logger';
import { errorHandler } from './middleware/error.middleware';

// App configurations
import authRoutes from './modules/auth/auth.routes';
import serviceRoutes from './modules/service/service.routes';
import vendorRoutes from './modules/vendor/vendor.routes';
import adminRoutes from './modules/admin/admin.routes';
import notificationRoutes from './modules/notification/notification.routes';

const app = express();

// Serve static files for uploaded documents (local fallback mode)
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

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
app.use('/notifications', notificationRoutes);

// Global centralized error handler
app.use(errorHandler as any);

// Auto-populate missing vendor codes for backward compatibility
import prisma from './config/prisma';
async function populateMissingVendorCodes() {
  try {
    const vendors = await prisma.vendorProfile.findMany({
      where: { vendorCode: null },
      orderBy: { createdAt: 'asc' },
    });

    if (vendors.length === 0) return;

    // Find the highest existing code
    const lastVendor = await prisma.vendorProfile.findFirst({
      where: { vendorCode: { startsWith: 'KSA-', not: null } },
      orderBy: { vendorCode: 'desc' },
    });

    let nextNumber = 1;
    if (lastVendor && lastVendor.vendorCode) {
      const match = lastVendor.vendorCode.match(/KSA-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    for (const vendor of vendors) {
      const vendorCode = `KSA-${String(nextNumber).padStart(4, '0')}`;
      await prisma.vendorProfile.update({
        where: { id: vendor.id },
        data: { vendorCode },
      });
      nextNumber++;
    }
    console.log(`Successfully populated ${vendors.length} missing vendor codes.`);
  } catch (err) {
    console.error('Error populating vendor codes on startup:', err);
  }
}

populateMissingVendorCodes();

export default app;
