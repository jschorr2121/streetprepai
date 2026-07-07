"use client";

import { useEffect } from "react";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("@sentry/nextjs").then((Sentry) => Sentry.captureException(error)).catch(() => {});
    }
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: "2rem",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f7f6f2",
          color: "#262a35",
        }}
      >
        <div style={{ maxWidth: 400 }}>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Application error</h1>
          <p
            style={{ color: "#262a35", opacity: 0.65, fontSize: "0.95rem", marginBottom: "1.5rem" }}
          >
            A critical error occurred. Please reload the page.
            {error.digest ? (
              <span
                style={{
                  display: "block",
                  marginTop: "0.5rem",
                  fontFamily: "monospace",
                  fontSize: "0.8rem",
                }}
              >
                ref: {error.digest}
              </span>
            ) : null}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "0.5rem 1.5rem",
              borderRadius: "0.375rem",
              border: "1px solid #33418f",
              background: "transparent",
              color: "#33418f",
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
