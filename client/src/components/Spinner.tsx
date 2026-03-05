interface Props {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function Spinner({ size = "md", className = "" }: Props) {
  const sizeClass = { sm: "w-5 h-5", md: "w-8 h-8", lg: "w-12 h-12" }[size];

  return (
    <div
      className={`${sizeClass} border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin ${className}`}
      role="status"
      aria-label="טוען..."
    >
      <span className="sr-only">טוען...</span>
    </div>
  );
}
