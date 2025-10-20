import { connectMongo } from '../config/db';
import { ProductModel } from '../models/product.model';
import { logger } from '../utils/logger';

async function seed() {
  await connectMongo();
  // TODO: replace with provided 12 products array; this is a placeholder
  const demo = [
    { sku: 'LEG-1', name: 'Demo Product', description: 'Placeholder', price: 10, category: 'demo', image: 'https://via.placeholder.com/300', featured: false, stock: 100, rating: 4.2, isActive: true }
  ];
  await ProductModel.deleteMany({});
  await ProductModel.insertMany(demo);
  logger.info('Seed completed');
  process.exit(0);
}

seed().catch((err) => {
  logger.error({ err }, 'Seed failed');
  process.exit(1);
});
