import type { ReactNode } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg" | "touch";
  children: ReactNode;
}

export function Button({ variant = "primary", size = "md", className = "", ...props }: ButtonProps) {
  const baseStyles = "font-medium rounded-md transition-colors inline-flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-accent text-white hover:opacity-90",
    secondary: "border border-edge text-ink hover:bg-page",
    ghost: "text-ink-2 hover:bg-page",
  };
  const sizes = {
    sm: "px-2.5 h-7 text-xs",
    md: "px-3 h-8 text-sm",
    lg: "px-4 h-10 text-base",
    touch: "px-4 h-11 text-sm",
  };
  return (
    <button className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />
  );
}
