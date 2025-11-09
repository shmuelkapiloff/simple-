"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSuccess = sendSuccess;
exports.sendError = sendError;
exports.ok = ok;
exports.fail = fail;
// Helper functions for sending responses
function sendSuccess(res, data, message, status = 200) {
    res.status(status).json({
        success: true,
        data,
        message
    });
}
function sendError(res, message, status = 400, errors) {
    res.status(status).json({
        success: false,
        message,
        errors: errors || []
    });
}
// Legacy functions (keep for backward compatibility)
function ok(data, message) {
    return { success: true, data, message };
}
function fail(message, errors) {
    return { success: false, message, errors: errors || [] };
}
