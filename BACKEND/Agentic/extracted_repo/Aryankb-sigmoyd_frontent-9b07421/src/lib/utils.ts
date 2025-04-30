import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// This is a simple utility to combine Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
