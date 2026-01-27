import { Request, Response } from "express";
import mongoose from "mongoose";
import { redis } from "../config/redisClient";
import { FailedWebhookModel } from "../models/failed-webhook.model";
import { WebhookEventModel } from "../models/webhook-event.model";

export async function getHealth(_req: Request, res: Response) {
  const mongoOk = mongoose.connection.readyState === 1;
  const redisOk = redis.status === "ready";
  
  // Check webhook health
  const webhookSecretConfigured = !!process.env.STRIPE_WEBHOOK_SECRET;
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const recentWebhooks = await WebhookEventModel.countDocuments({
    createdAt: { $gte: last24h },
  });
  
  const failedWebhooks = await FailedWebhookModel.countDocuments({
    status: "pending",
  });

  const degraded = !(mongoOk && redisOk);

  res.json({
    success: true,
    data: {
      status: degraded ? "degraded" : "healthy",
      warning: degraded,
      mongodb: mongoOk ? "connected" : "disconnected",
      redis: redisOk ? "connected" : "disconnected",
      webhooks: {
        secretConfigured: webhookSecretConfigured,
        receivedLast24h: recentWebhooks,
        failedPending: failedWebhooks,
        warning: !webhookSecretConfigured ? "STRIPE_WEBHOOK_SECRET not configured" : failedWebhooks > 5 ? `${failedWebhooks} failed webhooks pending retry` : null,
      },
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
