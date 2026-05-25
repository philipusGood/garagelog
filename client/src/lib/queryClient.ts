import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

export async function apiRequest(method: string, path: string, body?: unknown) {
  const res = await fetch(path, {
    method,
    headers: body && !(body instanceof FormData) ? { "Content-Type": "application/json" } : {},
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res;
}
