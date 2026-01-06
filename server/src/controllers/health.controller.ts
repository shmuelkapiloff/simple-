import { Request, Response } from "express";
import mongoose from "mongoose";
import { redis } from "../config/redisClient";
import { time } from "console";

export async function getHealth(_req: Request, res: Response) {
  const mongoOk = mongoose.connection.readyState === 1;
  const redisOk = redis.status === "ready";
  res.json({
    success: true,
    data: {
      status: mongoOk && redisOk ? "healthy" : "degraded",
      mongodb: mongoOk ? "connected" : "disconnected",
      redis: redisOk ? "connected" : "disconnected",
      uptime: process.uptime(),
    },
  });
}

export async function ping(_req: Request, res: Response) {
  res.json({
    success: true,
    message: "pong",
    data: { time: Date.now() },
  });
}
