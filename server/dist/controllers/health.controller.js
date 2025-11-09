"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHealth = getHealth;
exports.ping = ping;
const mongoose_1 = __importDefault(require("mongoose"));
const redisClient_1 = require("../config/redisClient");
async function getHealth(_req, res) {
    const mongoOk = mongoose_1.default.connection.readyState === 1;
    const redisOk = redisClient_1.redis.status === "ready";
    res.json({
        success: true,
        data: { status: "ok", mongo: mongoOk, redis: redisOk },
    });
}
async function ping(_req, res) {
    res.json({
        success: true,
        data: { time: Date.now() },
    });
}
