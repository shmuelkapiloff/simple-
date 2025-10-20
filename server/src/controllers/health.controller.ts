import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { redis } from '../config/redisClient';

export async function getHealth(_req: Request, res: Response) {
  const mongoOk = mongoose.connection.readyState === 1;
  const redisOk = redis.status === 'ready';
  res.json({ success: true, data: { status: 'ok', mongo: mongoOk, redis: redisOk } });
}
