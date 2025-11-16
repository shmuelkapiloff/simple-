// client/src/components/DebugPanel.tsx
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../app/store";
import { ApiLogger } from "../utils/apiLogger";

export const DebugPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "state" | "api" | "network" | "performance"
  >("state");

  const cartState = useSelector((state: RootState) => state.cart);
  const apiState = useSelector((state: RootState) => state.api);

  const apiHistory = ApiLogger.getHistory();
  const apiStats = ApiLogger.getStats();

  // אל תציג בproduction
  if (import.meta.env.MODE === "production") return null;

  const clearApiHistory = () => {
    ApiLogger.clearHistory();
    // רענון הקומפוננטה
    setActiveTab("api");
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          bg-blue-600 text-white p-3 rounded-full shadow-lg 
          hover:bg-blue-700 transition-colors transform hover:scale-105
          ${isOpen ? "rotate-45" : ""}
        `}
        title="Debug Panel"
      >
        🔍
      </button>

      {/* Debug Panel */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 bg-white border border-gray-200 rounded-lg shadow-xl w-[500px] max-h-[600px] overflow-hidden">
          {/* Header */}
          <div className="bg-gray-50 p-3 border-b flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">🔧 Debug Panel</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b bg-gray-50">
            {(
              [
                {
                  id: "state",
                  label: "🗄️ State",
                  count: Object.keys(cartState).length,
                },
                { id: "api", label: "🌐 API", count: apiHistory.length },
                { id: "network", label: "📡 Network", count: apiStats.total },
                { id: "performance", label: "⚡ Perf", count: null },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 p-2 text-sm font-medium relative ${
                  activeTab === tab.id
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {tab.label}
                {tab.count !== null && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="overflow-auto max-h-[500px]">
            {/* State Tab */}
            {activeTab === "state" && (
              <div className="p-4">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <strong className="text-gray-700">🛒 Cart State</strong>
                      <span className="text-xs text-gray-500">
                        {Object.keys(cartState).length} properties
                      </span>
                    </div>
                    <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-48 border">
                      {JSON.stringify(cartState, null, 2)}
                    </pre>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <strong className="text-gray-700">🌐 API State</strong>
                      <span className="text-xs text-gray-500">
                        {Object.keys(apiState.queries).length} queries
                      </span>
                    </div>
                    <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-48 border">
                      {JSON.stringify(apiState, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* API Tab */}
            {activeTab === "api" && (
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold text-gray-700">
                    📝 API Calls History
                  </h4>
                  <button
                    onClick={clearApiHistory}
                    className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                  >
                    🧹 Clear
                  </button>
                </div>

                <div className="space-y-2">
                  {apiHistory.slice(0, 20).map((call: any, index: number) => (
                    <div
                      key={index}
                      className={`p-3 rounded border-l-4 ${
                        call.status === "SUCCESS"
                          ? "bg-green-50 border-green-400"
                          : call.status === "ERROR"
                          ? "bg-red-50 border-red-400"
                          : "bg-yellow-50 border-yellow-400"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {call.endpoint}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {call.startTime} | {call.duration}ms
                          </div>
                        </div>
                        <div
                          className={`text-xs px-2 py-1 rounded ${
                            call.status === "SUCCESS"
                              ? "bg-green-100 text-green-800"
                              : call.status === "ERROR"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {call.status}
                        </div>
                      </div>

                      {call.data && (
                        <details className="mt-2">
                          <summary className="text-xs cursor-pointer text-blue-600">
                            📤 Request Data
                          </summary>
                          <pre className="text-xs bg-gray-100 p-2 mt-1 rounded overflow-auto max-h-20">
                            {JSON.stringify(call.data, null, 2)}
                          </pre>
                        </details>
                      )}

                      {call.response && (
                        <details className="mt-2">
                          <summary className="text-xs cursor-pointer text-green-600">
                            📥 Response
                          </summary>
                          <pre className="text-xs bg-gray-100 p-2 mt-1 rounded overflow-auto max-h-20">
                            {JSON.stringify(call.response, null, 2)}
                          </pre>
                        </details>
                      )}

                      {call.error && (
                        <details className="mt-2">
                          <summary className="text-xs cursor-pointer text-red-600">
                            💥 Error
                          </summary>
                          <pre className="text-xs bg-red-100 p-2 mt-1 rounded overflow-auto max-h-20">
                            {JSON.stringify(call.error, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}

                  {apiHistory.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      <div className="text-2xl mb-2">🌐</div>
                      <div>No API calls yet</div>
                      <div className="text-xs mt-1">
                        Make some API calls to see them here
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Network Tab */}
            {activeTab === "network" && (
              <div className="p-4">
                <h4 className="font-semibold mb-4 text-gray-700">
                  📊 Network Statistics
                </h4>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-blue-50 p-3 rounded">
                    <div className="text-lg font-bold text-blue-600">
                      {apiStats.total}
                    </div>
                    <div className="text-xs text-blue-800">Total Calls</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <div className="text-lg font-bold text-green-600">
                      {apiStats.success}
                    </div>
                    <div className="text-xs text-green-800">Successful</div>
                  </div>
                  <div className="bg-red-50 p-3 rounded">
                    <div className="text-lg font-bold text-red-600">
                      {apiStats.error}
                    </div>
                    <div className="text-xs text-red-800">Errors</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-lg font-bold text-gray-600">
                      {apiStats.avgDuration}ms
                    </div>
                    <div className="text-xs text-gray-800">Avg Duration</div>
                  </div>
                </div>

                <div className="text-xs text-gray-600">
                  <p className="mb-2">
                    🎯 <strong>Success Rate:</strong>{" "}
                    {apiStats.total > 0
                      ? Math.round((apiStats.success / apiStats.total) * 100)
                      : 0}
                    %
                  </p>

                  {apiStats.avgDuration > 1000 && (
                    <p className="text-orange-600">
                      ⚠️ Average response time is high ({apiStats.avgDuration}
                      ms)
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Performance Tab */}
            {activeTab === "performance" && (
              <div className="p-4">
                <h4 className="font-semibold mb-4 text-gray-700">
                  ⚡ Performance Info
                </h4>

                <div className="space-y-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <h5 className="font-medium mb-2">
                      🔧 Available Debug Tools
                    </h5>
                    <div className="text-xs space-y-1">
                      <div>• Redux DevTools: Press F12 → Redux tab</div>
                      <div>• React DevTools: Browser extension needed</div>
                      <div>• Console: All logs are in browser console</div>
                      <div>• Network: F12 → Network tab for API calls</div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-3 rounded">
                    <h5 className="font-medium mb-2">🌐 Console Commands</h5>
                    <div className="text-xs space-y-1 font-mono">
                      <div>__REDUX_STORE__.getState()</div>
                      <div>__API_LOGGER__.getHistory()</div>
                      <div>__API_LOGGER__.getStats()</div>
                      <div>__API_LOGGER__.clearHistory()</div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-3 rounded">
                    <h5 className="font-medium mb-2">📱 Keyboard Shortcuts</h5>
                    <div className="text-xs space-y-1">
                      <div>
                        <kbd className="bg-gray-200 px-1 rounded">F12</kbd> -
                        Open DevTools
                      </div>
                      <div>
                        <kbd className="bg-gray-200 px-1 rounded">
                          Ctrl+Shift+I
                        </kbd>{" "}
                        - Open DevTools
                      </div>
                      <div>
                        <kbd className="bg-gray-200 px-1 rounded">Ctrl+R</kbd> -
                        Refresh page
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
