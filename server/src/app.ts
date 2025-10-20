import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { errorHandler } from './middlewares/error.middleware';
import { healthRouter } from './routes/health.routes';
import { productRouter } from './routes/product.routes';

export function createApp() {
  const app = express();

  // Middlewares
  app.use(cors()); // Allow cross-origin requests in dev; tighten later
  app.use(compression()); // gzip responses
  app.use(express.json()); // parse JSON bodies

  // Routes
  app.use('/api/health', healthRouter);
  app.use('/api/products', productRouter);

  // Error handler (keep last)
  app.use(errorHandler);

  return app;
}
