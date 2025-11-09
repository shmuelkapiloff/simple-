"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const logger_1 = require("../utils/logger");
const response_1 = require("../utils/response");
function errorHandler(err, _req, res, _next) {
    logger_1.logger.error({ err }, "Unhandled error");
    const status = err.status || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json((0, response_1.fail)(message));
}
