"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectMongo = connectMongo;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
const logger_1 = require("../utils/logger");
async function connectMongo() {
    try {
        await mongoose_1.default.connect(env_1.env.MONGO_URI);
        logger_1.logger.info({ uri: env_1.env.MONGO_URI }, "Mongo connected");
    }
    catch (err) {
        logger_1.logger.error({ err }, "Mongo connection failed");
        throw err;
    }
}
