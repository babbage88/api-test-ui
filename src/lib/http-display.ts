import type { HttpMethod } from "@/types";

export const methodStyles: Record<HttpMethod, string> = {
  GET: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  POST: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  PUT: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  DELETE: "border-destructive/20 bg-destructive/10 text-destructive",
};
