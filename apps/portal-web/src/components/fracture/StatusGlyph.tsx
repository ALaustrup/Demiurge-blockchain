"use client";

import { CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";

type StatusType = "success" | "error" | "loading" | "warning";

interface StatusGlyphProps {
  status: StatusType;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const statusConfig = {
  success: { icon: CheckCircle2, color: "text-green-400" },
  error: { icon: XCircle, color: "text-red-400" },
  loading: { icon: Loader2, color: "text-cyan-400" },
  warning: { icon: AlertCircle, color: "text-yellow-400" },
};

const sizeConfig = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

export function StatusGlyph({ status, size = "md", className = "" }: StatusGlyphProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const sizeClass = sizeConfig[size];

  return (
    <Icon
      className={`${sizeClass} ${config.color} ${status === "loading" ? "animate-spin" : ""} ${className}`}
    />
  );
}

