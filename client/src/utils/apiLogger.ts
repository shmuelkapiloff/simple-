// client/src/utils/apiLogger.ts
const DEV_ENABLED = (import.meta as any)?.env?.DEV === true;
const LOGGER_ENABLED =
  DEV_ENABLED || (import.meta as any)?.env?.VITE_API_LOGGER === "1";

export class ApiLogger {
  private static calls: Map<string, any> = new Map();

  static startCall(endpoint: string, data?: any) {
    const callId = `${endpoint}_${Date.now()}`;
    const callInfo = {
      id: callId,
      endpoint,
      data,
      startTime: new Date().toISOString(),
      timestamp: Date.now(),
      status: "PENDING",
    };

    this.calls.set(callId, callInfo);

    if (LOGGER_ENABLED) {
      console.group(`🌐 API Call Starting: ${endpoint}`);
      console.log("📤 Request Data:", data);
      console.log("⏰ Time:", callInfo.startTime);
      console.groupEnd();
    }

    return callId;
  }

  static endCall(callId: string, response: any, error?: any) {
    const callInfo = this.calls.get(callId);
    if (!callInfo) return;

    const duration = Date.now() - callInfo.timestamp;

    if (error) {
      if (LOGGER_ENABLED) {
        console.group(
          `❌ API Call Failed: ${callInfo.endpoint} (${duration}ms)`
        );
        console.log("📤 Original Request:", callInfo.data);
        console.log("💥 Error:", error);
        console.groupEnd();
      }

      callInfo.status = "ERROR";
      callInfo.error = error;
    } else {
      if (LOGGER_ENABLED) {
        console.group(
          `✅ API Call Success: ${callInfo.endpoint} (${duration}ms)`
        );
        console.log("📤 Request:", callInfo.data);
        console.log("📥 Response:", response);
        console.groupEnd();
      }

      callInfo.status = "SUCCESS";
      callInfo.response = response;
    }

    callInfo.duration = duration;
    callInfo.endTime = new Date().toISOString();

    // שמור בhistory
    this.saveToHistory(callInfo);
  }

  private static saveToHistory(callInfo: any) {
    const history = JSON.parse(
      localStorage.getItem("api_call_history") || "[]"
    );
    history.unshift(callInfo);

    // שמור רק 50 הקריאות האחרונות
    if (history.length > 50) {
      history.splice(50);
    }

    localStorage.setItem("api_call_history", JSON.stringify(history));
  }

  static getHistory() {
    return JSON.parse(localStorage.getItem("api_call_history") || "[]");
  }

  static clearHistory() {
    localStorage.removeItem("api_call_history");
    console.log("🧹 API Call History Cleared");
  }

  static getStats() {
    const history = this.getHistory();
    const stats = {
      total: history.length,
      success: history.filter((call: any) => call.status === "SUCCESS").length,
      error: history.filter((call: any) => call.status === "ERROR").length,
      avgDuration:
        history.length > 0
          ? Math.round(
              history.reduce(
                (sum: number, call: any) => sum + (call.duration || 0),
                0
              ) / history.length
            )
          : 0,
    };

    if (LOGGER_ENABLED) {
      console.table(stats);
    }
    return stats;
  }
}

// 🎯 הוסף לwindow לגישה מקלדת דפדפן
if (typeof window !== "undefined") {
  (window as any).__API_LOGGER__ = ApiLogger;
  if (LOGGER_ENABLED) {
    console.log("🌐 ApiLogger available at window.__API_LOGGER__");
    console.log(
      "💡 Try: __API_LOGGER__.getHistory() or __API_LOGGER__.getStats()"
    );
  }
}
