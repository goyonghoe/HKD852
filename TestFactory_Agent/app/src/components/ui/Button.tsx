import { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "kakao" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary/90 active:bg-primary/80 shadow-sm",
  secondary:
    "bg-secondary text-white hover:bg-secondary/90 active:bg-secondary/80 shadow-sm",
  kakao:
    "bg-kakao text-kakao-text hover:bg-kakao/90 active:bg-kakao/80 shadow-sm",
  outline:
    "bg-transparent border-2 border-surface-border text-text-primary hover:border-primary hover:text-primary active:bg-primary-bg",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-4 py-2.5 text-sm",
  md: "px-6 py-3.5 text-base",
  lg: "px-8 py-4.5 text-lg",
};

export default function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        "rounded-2xl font-bold transition-all duration-200",
        "hover:scale-[1.02] active:scale-[0.98]",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
        variantStyles[variant],
        sizeStyles[size],
        fullWidth ? "w-full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
