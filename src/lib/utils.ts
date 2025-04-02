import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// This is a simple utility to combine Tailwind classes
export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}
