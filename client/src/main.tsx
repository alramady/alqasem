import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import "./index.css";
import { getCsrfToken, resetCsrfToken } from "./hooks/useCsrfToken";

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  // Only redirect if we're on an admin page
  if (window.location.pathname.startsWith("/admin") && !window.location.pathname.includes("/admin/login")) {
    window.location.href = "/admin/login";
  }
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);

    // If CSRF token error, reset the cached token so next request fetches a fresh one
    if (
      error instanceof TRPCClientError &&
      (error.message?.includes("CSRF") || error.message?.includes("csrf"))
    ) {
      resetCsrfToken();
    }

    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      async headers() {
        // Attach the CSRF token to every request as a custom header.
        // The server validates this on all POST (mutation) requests.
        try {
          const csrfToken = await getCsrfToken();
          return {
            "x-csrf-token": csrfToken,
          };
        } catch {
          // If we can't get the token, send request without it.
          // The server will reject mutations but queries will still work.
          return {};
        }
      },
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
