"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.env = {
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: Number(process.env.PORT || 4001),
    MONGO_URI: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/simple_shop",
    REDIS_URL: process.env.REDIS_URL || "redis://127.0.0.1:6379",
    LOG_LEVEL: process.env.LOG_LEVEL || "info",
};
