// src/pages/CTraderCallbackPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useExchangeCTraderOAuthCodeMutation } from "../../../services/tradingAccounts.api";

type Status = "loading" | "success" | "error";

/**
 * cTrader OAuth callback page
 * - Reads ?code= from URL (or ?error=...)
 * - Sends ONLY the code to backend via RTK Query mutation
 * - Backend identifies user via auth cookie (credentials: include)
 */
export default function CTraderCallbackPage() {
  const navigate = useNavigate();

  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const code = params.get("code");
  const error = params.get("error");
  const errorDescription = params.get("error_description");

  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState<string>(
    "Connecting your cTrader account..."
  );

  const [exchangeCode] = useExchangeCTraderOAuthCodeMutation();

  useEffect(() => {
    // If cTrader sent an error
    if (error) {
      setStatus("error");
      setMessage(errorDescription ? `${error}: ${errorDescription}` : error);
      return;
    }

    if (!code) {
      setStatus("error");
      setMessage("Missing authorization code in URL. (No ?code= found)");
      return;
    }

    (async () => {
      try {
        setStatus("loading");
        setMessage("Exchanging authorization code...");

        // ✅ RTK Query call (cookies sent by baseApi or by endpoint definition)
        // Using unwrap() to throw on non-2xx
        await exchangeCode({ code }).unwrap();

        // Optional: remove ?code= from browser URL after success
        window.history.replaceState({}, document.title, window.location.pathname);

        setStatus("success");
        setMessage("cTrader connected ✅ Redirecting you back...");

        // Optional: if this page opened in a popup, notify opener
        try {
          window.opener?.postMessage({ type: "CTRADER_CONNECTED", ok: true }, "*");
        } catch {}

        // Redirect user to wherever you want (settings page, broker page, etc.)
        setTimeout(() => navigate("/settings/brokers"), 700);
      } catch (e: any) {
        // RTK Query unwrap throws either:
        // - { status, data } shape
        // - or Error instance
        const msg =
          e?.data?.message ||
          e?.data?.error ||
          e?.error ||
          e?.message ||
          "Token exchange failed";

        setStatus("error");
        setMessage(msg);
      }
    })();
  }, [code, error, errorDescription, navigate, exchangeCode]);

  return (
    <div
      style={{
        maxWidth: 560,
        margin: "64px auto",
        padding: 16,
        fontFamily: "system-ui",
      }}
    >
      <h2 style={{ marginBottom: 8 }}>cTrader Connection</h2>

      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 16,
          background: "#fff",
        }}
      >
        <p style={{ margin: 0 }}>{message}</p>

        {status === "loading" && (
          <p style={{ marginTop: 10, opacity: 0.7 }}>
            Please don’t close this tab.
          </p>
        )}

        {status === "error" && (
          <div style={{ marginTop: 12 }}>
            <p style={{ color: "crimson", marginTop: 0 }}>
              Fix checklist:
              <br />• Redirect URI must match EXACTLY what's whitelisted in cTrader Open API settings
              <br />• Backend must accept cookies (SameSite/Domain/CORS) and return 200
            </p>

            <button
              onClick={() => navigate("/settings/brokers")}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                cursor: "pointer",
                background: "#f9fafb",
              }}
            >
              Go back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
