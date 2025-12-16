// src/components/auth/AuthModal.tsx
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import SignInPage from "./SignIn";
import SignUpPage from "./SignUp";
 

type Tab = "login" | "signup";

type Props = {
  open: boolean;
  onClose: () => void;
  defaultTab?: Tab;
  /**
   * Called after login/register success (so subscriptions page can continue)
   */
  onAuthed?: () => void;
};

const AuthModal: React.FC<Props> = ({ open, onClose, defaultTab = "login", onAuthed }) => {
  const [tab, setTab] = useState<Tab>(defaultTab);

  useEffect(() => setTab(defaultTab), [defaultTab, open]);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[999]">
      {/* backdrop */}
      <button
        onClick={onClose}
        className="absolute inset-0 bg-black/70"
        aria-label="Close auth modal"
      />

      {/* modal */}
      <div className="relative mx-auto mt-10 w-[95%] max-w-3xl rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl">
        {/* top bar */}
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab("login")}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                tab === "login"
                  ? "bg-emerald-500 text-slate-950"
                  : "bg-slate-900 text-slate-200 hover:bg-slate-800"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setTab("signup")}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                tab === "signup"
                  ? "bg-emerald-500 text-slate-950"
                  : "bg-slate-900 text-slate-200 hover:bg-slate-800"
              }`}
            >
              Register
            </button>
          </div>

          <button
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* body: reuse your pages but in modal mode */}
        <div className="max-h-[80vh] overflow-auto">
          {tab === "login" ? (
            <SignInPage
              mode="modal"
              onSwitchToSignup={() => setTab("signup")}
              onAuthed={() => {
                onClose();
                onAuthed?.();
              }}
            />
          ) : (
            <SignUpPage
              mode="modal"
              onSwitchToSignin={() => setTab("login")}
              onAuthed={() => {
                onClose();
                onAuthed?.();
              }}
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AuthModal;
