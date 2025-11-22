import React, { useState } from "react";
import {
  Copy,
  RefreshCcw,
  Check,
  Webhook,
  Info,
  Code,
  Play,
} from "lucide-react";

const TradingViewWebhookPage: React.FC = () => {
  const [copied, setCopied] = useState("");
  const [secret, setSecret] = useState("tvsec_" + generateId());
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const strategyId = "strategy_12983"; // mock strategy ID

  const webhookUrl = `https://yourdomain.com/api/webhook/${strategyId}`;

  function generateId() {
    return Math.random().toString(36).substring(2, 10);
  }

  const handleCopy = (value: string) => {
    navigator.clipboard.writeText(value);
    setCopied(value);
    setTimeout(() => setCopied(""), 1500);
  };

  const regenerateSecret = () => {
    setSecret("tvsec_" + generateId());
  };

  const sendTestPayload = () => {
    const fakeResponse = JSON.stringify(
      {
        status: "success",
        received: true,
        timestamp: new Date().toISOString(),
      },
      null,
      2
    );

    setTestResponse(fakeResponse);
  };

  const examplePayload = `{
  "strategy_id": "${strategyId}",
  "secret": "${secret}",
  "action": "{{strategy.order.action}}",
  "contracts": "{{strategy.order.contracts}}",
  "price": "{{strategy.order.price}}",
  "ticker": "{{ticker}}",
  "time": "{{time}}"
}`;

  return (
    <div className="min-h-screen px-6 pt-16  md:pt-28 bg-slate-950 text-slate-100 p-6 space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Webhook size={26} className="text-emerald-400" />
          TradingView Webhook Setup
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Connect TradingView alerts directly to your strategy using webhook
          automation.
        </p>
      </div>

      {/* MAIN CONTENT */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* LEFT SIDE */}
        <div className="space-y-6">
          {/* Webhook URL */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
            <h3 className="text-lg font-semibold mb-2">Webhook URL</h3>

            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 justify-between">
              <span className="text-sm text-slate-300">{webhookUrl}</span>

              <button
                onClick={() => handleCopy(webhookUrl)}
                className="p-2 rounded-lg hover:bg-slate-800 transition"
              >
                {copied === webhookUrl ? (
                  <Check size={18} className="text-emerald-400" />
                ) : (
                  <Copy size={18} />
                )}
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-2">
              Paste this URL in TradingView → Alert → Webhook URL field.
            </p>
          </div>

          {/* Secret Key */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold mb-2">Webhook Secret Key</h3>
              <button
                onClick={regenerateSecret}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm"
              >
                <RefreshCcw size={14} /> Regenerate
              </button>
            </div>

            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 justify-between">
              <span className="text-sm text-slate-300">{secret}</span>

              <button
                onClick={() => handleCopy(secret)}
                className="p-2 rounded-lg hover:bg-slate-800 transition"
              >
                {copied === secret ? (
                  <Check size={18} className="text-emerald-400" />
                ) : (
                  <Copy size={18} />
                )}
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-2">
              Add this in TradingView alert message as: <br />
              <span className="text-emerald-400 font-mono">
                "secret": "${secret}"
              </span>
            </p>
          </div>

          {/* Example JSON */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
              <Code size={18} /> TradingView Alert Payload
            </h3>

            <pre className="bg-slate-950 border border-slate-800 p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap">
{examplePayload}
            </pre>

            <button
              onClick={() => handleCopy(examplePayload)}
              className="flex items-center gap-2 mt-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm"
            >
              <Copy size={16} /> Copy Payload
            </button>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="space-y-6">
          {/* Instructions */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
              <Info size={18} /> How to Connect with TradingView
            </h3>

            <ol className="list-decimal list-inside space-y-2 text-sm text-slate-300">
              <li>Open TradingView.</li>
              <li>Open your chart → Create Alert.</li>
              <li>Enable “Webhook URL”.</li>
              <li>Paste the URL from above.</li>
              <li>Paste the JSON payload from above into “Message”.</li>
              <li>Save the alert.</li>
            </ol>

            <p className="text-xs text-slate-500 mt-3">
              After this, every alert will automatically trigger your strategy
              on our platform.
            </p>
          </div>

          {/* Test Webhook */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
            <h3 className="text-lg font-semibold mb-3">Test Your Webhook</h3>

            <button
              onClick={sendTestPayload}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-slate-900 rounded-lg hover:bg-emerald-400 transition"
            >
              <Play size={18} />
              Send Test Alert
            </button>

            {testResponse && (
              <div className="mt-4">
                <p className="text-sm text-slate-400 mb-1">Response:</p>
                <pre className="bg-slate-950 border border-slate-800 p-4 rounded-lg text-xs whitespace-pre-wrap">
{testResponse}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingViewWebhookPage;
