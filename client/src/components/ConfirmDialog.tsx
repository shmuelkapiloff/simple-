interface Props {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "אישור",
  cancelLabel = "ביטול",
  variant = "danger",
  isLoading,
  onConfirm,
  onCancel,
}: Props) {
  const confirmStyles =
    variant === "danger"
      ? "bg-red-600 text-white hover:bg-red-700"
      : "bg-yellow-500 text-white hover:bg-yellow-600";

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-desc"
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6"
      >
        <h2 id="confirm-title" className="text-lg font-bold text-gray-900 mb-2">
          {title}
        </h2>
        <p id="confirm-desc" className="text-sm text-gray-600 mb-6">
          {message}
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 ${confirmStyles}`}
          >
            {isLoading ? "..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
