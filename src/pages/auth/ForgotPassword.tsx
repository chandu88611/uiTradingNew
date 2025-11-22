// ForgotPasswordPage.tsx
import React from "react";
import { useForm } from "react-hook-form";
import { FiMail } from "react-icons/fi";
import { Link } from "react-router-dom";

type ForgotFormValues = {
  email: string;
};

const ForgotPasswordPage: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotFormValues>();

  const onSubmit = (data: ForgotFormValues) => {
    console.log("Forgot password:", data);
  };

  return (
    <div className="relative bg-slate-950 text-slate-50 pt-16  md:pt-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.22),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(16,185,129,0.18),_transparent_55%)]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-140px)] max-w-5xl items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-3xl border border-slate-800/80 bg-slate-900/90 p-6 sm:p-8 shadow-[0_20px_70px_rgba(15,23,42,0.9)] backdrop-blur-xl transition-all duration-500 hover:border-emerald-400/70">
          
          <div className="mb-6 space-y-2">
            <span className="inline-flex items-center rounded-full bg-slate-800/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-indigo-300">
              Forgot Password
            </span>
            <h2 className="text-xl sm:text-2xl font-semibold">
              Recover your account
            </h2>
            <p className="text-sm text-slate-400">
              Enter your email and we’ll send you reset instructions.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">
                  <FiMail />
                </span>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-10 py-2.5 text-sm text-slate-50 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /\S+@\S+\.\S+/,
                      message: "Enter a valid email",
                    },
                  })}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-rose-400">
                  {errors.email.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-emerald-400 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_0_30px_rgba(16,185,129,0.6)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-300 disabled:opacity-60"
            >
              {isSubmitting ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          <div className="mt-5 text-center">
            <Link
              to="/auth/signin"
              className="text-sm text-emerald-400 hover:text-emerald-300"
            >
              Back to Login
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
