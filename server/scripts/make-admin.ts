import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { UserModel } from "../src/models/user.model";

dotenv.config();

const getArg = (key: string, fallback?: string) => {
  const prefix = `--${key}=`;
  const raw = process.argv.find((arg) => arg.startsWith(prefix));
  if (!raw) return fallback;
  return raw.slice(prefix.length);
};

async function main() {
  const email = getArg("email");
  const name = getArg("name", "Admin User");
  const password = getArg("password", "Admin123!");
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error("Missing MONGO_URI in environment");
    process.exit(1);
  }

  if (!email) {
    console.error("Usage: ts-node scripts/make-admin.ts --email=user@example.com [--name=Name] [--password=Secret]");
    process.exit(1);
  }

  const conn = await mongoose.connect(uri);
  console.log(`Connected to Mongo DB: ${conn.connection.name}`);

  const hashed = await bcrypt.hash(password || "Admin123!", 12);

  const result = await UserModel.findOneAndUpdate(
    { email },
    {
      $set: {
        email,
        name,
        password: hashed,
        role: "admin",
        isActive: true,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    { upsert: true, new: true, lean: true }
  );

  console.log(`Ensured admin user: ${email}`);
  console.log(result);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
