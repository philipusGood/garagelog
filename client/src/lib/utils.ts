import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string) {
  if (!date) return "—";
  const [y, m, d] = date.split("-");
  return `${m}/${d}/${y}`;
}

export function formatMileage(n: number | null | undefined) {
  if (n == null) return "—";
  return n.toLocaleString() + " km";
}

export function formatCost(n: number | null | undefined) {
  if (n == null) return "—";
  return "$" + n.toFixed(2);
}
