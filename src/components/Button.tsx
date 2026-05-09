interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: "primary" | "danger" | "outline";
  disabled?: boolean;
  fullWidth?: boolean;
}

export default function Button({
  label,
  onClick,
  variant = "primary",
  disabled,
  fullWidth,
}: ButtonProps) {
  const base =
    "py-2.5 px-6 text-sm font-medium rounded-lg transition-colors disabled:opacity-50";
  const variants = {
    primary: "bg-emerald-500 hover:bg-emerald-600 text-white",
    danger: "bg-red-500 hover:bg-red-600 text-white",
    outline:
      "border border-gray-200 text-gray-600 hover:border-emerald-300 bg-white",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${fullWidth ? "w-full" : ""}`}
    >
      {label}
    </button>
  );
}
