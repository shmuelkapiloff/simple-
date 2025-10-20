import { connectMongo } from "../config/db";
import { ProductModel } from "../models/product.model";
import { logger } from "../utils/logger";

async function seed() {
  await connectMongo();
  // מערך 12 מוצרים אמיתיים לחנות טכנולוגיה
  const products = [
    {
      sku: "LEG-1",
      name: "iPhone 15 Pro",
      description: "Latest iPhone with A17 Pro chip, titanium design",
      price: 999,
      category: "smartphones",
      image:
        "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=300",
      featured: true,
      stock: 50,
      rating: 4.8,
      isActive: true,
    },
    {
      sku: "LEG-2",
      name: "MacBook Air M3",
      description: "Ultra-thin laptop with M3 chip, 13-inch Retina display",
      price: 1199,
      category: "laptops",
      image: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=300",
      featured: true,
      stock: 30,
      rating: 4.9,
      isActive: true,
    },
    {
      sku: "LEG-3",
      name: "AirPods Pro 2",
      description: "Wireless earbuds with active noise cancellation",
      price: 249,
      category: "audio",
      image:
        "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=300",
      featured: false,
      stock: 75,
      rating: 4.7,
      isActive: true,
    },
    {
      sku: "LEG-4",
      name: 'iPad Pro 12.9"',
      description:
        "Professional tablet with M2 chip and Liquid Retina XDR display",
      price: 1099,
      category: "tablets",
      image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=300",
      featured: true,
      stock: 25,
      rating: 4.8,
      isActive: true,
    },
    {
      sku: "LEG-5",
      name: "Apple Watch Series 9",
      description: "Advanced smartwatch with health monitoring features",
      price: 399,
      category: "wearables",
      image:
        "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=300",
      featured: false,
      stock: 60,
      rating: 4.6,
      isActive: true,
    },
    {
      sku: "LEG-6",
      name: "Magic Keyboard",
      description: "Wireless keyboard with backlit keys and Touch ID",
      price: 179,
      category: "accessories",
      image:
        "https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=300",
      featured: false,
      stock: 40,
      rating: 4.5,
      isActive: true,
    },
    {
      sku: "LEG-7",
      name: "Studio Display",
      description: "27-inch 5K Retina display with True Tone technology",
      price: 1599,
      category: "displays",
      image:
        "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=300",
      featured: true,
      stock: 15,
      rating: 4.7,
      isActive: true,
    },
    {
      sku: "LEG-8",
      name: "Magic Mouse",
      description: "Multi-Touch wireless mouse with rechargeable battery",
      price: 79,
      category: "accessories",
      image:
        "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=300",
      featured: false,
      stock: 80,
      rating: 4.3,
      isActive: true,
    },
    {
      sku: "LEG-9",
      name: "HomePod mini",
      description: "Smart speaker with Siri and amazing sound quality",
      price: 99,
      category: "smart-home",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300",
      featured: false,
      stock: 35,
      rating: 4.4,
      isActive: true,
    },
    {
      sku: "LEG-10",
      name: "Apple TV 4K",
      description: "Streaming device with 4K HDR and Dolby Vision support",
      price: 179,
      category: "streaming",
      image:
        "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=300",
      featured: false,
      stock: 45,
      rating: 4.5,
      isActive: true,
    },
    {
      sku: "LEG-11",
      name: "MagSafe Charger",
      description: "Wireless charger with magnetic alignment for iPhone",
      price: 39,
      category: "accessories",
      image:
        "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=300",
      featured: false,
      stock: 100,
      rating: 4.2,
      isActive: true,
    },
    {
      sku: "LEG-12",
      name: "AirTag 4-Pack",
      description: "Bluetooth tracking devices for finding your items",
      price: 99,
      category: "accessories",
      image:
        "https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=300",
      featured: false,
      stock: 70,
      rating: 4.6,
      isActive: true,
    },
  ];
  await ProductModel.deleteMany({});
  await ProductModel.insertMany(products);
  logger.info(`Seed completed: ${products.length} products inserted`);
  process.exit(0);
}

seed().catch((err) => {
  logger.error({ err }, "Seed failed");
  process.exit(1);
});
