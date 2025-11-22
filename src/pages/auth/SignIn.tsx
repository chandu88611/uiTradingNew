// SignInPage.tsx
import React from "react";
import { useForm } from "react-hook-form";
import { FiMail, FiLock } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { Link } from "react-router-dom";

type SignInFormValues = {
  email: string;
  password: string;
  remember: boolean;
};

const SignInPage: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormValues>();

  const onSubmit = (data: SignInFormValues) => {
    console.log("Sign in data:", data);
  };

  const handleGoogleSignIn = () => {
    console.log("Google sign in");
  };

  return (
    <div className="relative bg-slate-950 text-slate-50 pt-16  md:pt-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.25),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(16,185,129,0.18),_transparent_55%)]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-140px)] max-w-5xl items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-3xl border border-slate-800/80 bg-slate-900/90 p-6 sm:p-8 shadow-[0_20px_70px_rgba(15,23,42,0.9)] backdrop-blur-xl transition-all duration-500 hover:border-emerald-400/70 hover:shadow-[0_0_90px_rgba(56,189,248,0.4)]">
          <div className="mb-6 space-y-2">
            <span className="inline-flex items-center rounded-full bg-slate-800/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-indigo-300/90">
              Welcome back
            </span>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
              Sign in to your{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-emerald-300 bg-clip-text text-transparent">
                TradebroX portal
              </span>
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Don&apos;t have an account?{" "}
              <Link
                to="/auth/signup"
                className="font-medium text-emerald-400 hover:text-emerald-300"
              >
                Create one
              </Link>
            </p>
          </div>

          {/* Google button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="mb-5 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-600/80 bg-slate-900/80 py-2.5 text-sm font-medium shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-400/60 hover:bg-slate-800/90 hover:shadow-[0_12px_40px_rgba(15,23,42,0.75)]"
          >
            <FcGoogle className="text-xl" />
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="mb-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-700/70" />
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
              or
            </span>
            <div className="h-px flex-1 bg-slate-700/70" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Email address
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">
                  <FiMail />
                </span>
                <input
                  type="email"
                  autoComplete="email"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-10 py-2.5 text-sm text-slate-50 placeholder:text-slate-500 outline-none transition-all duration-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                  placeholder="you@example.com"
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
                <p className="mt-0.5 text-xs text-rose-400">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Password
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">
                  <FiLock />
                </span>
                <input
                  type="password"
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-10 py-2.5 text-sm text-slate-50 placeholder:text-slate-500 outline-none transition-all duration-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                  placeholder="Enter your password"
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "At least 6 characters",
                    },
                  })}
                />
              </div>
              {errors.password && (
                <p className="mt-0.5 text-xs text-rose-400">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember + forgot */}
            <div className="flex items-center justify-between text-xs text-slate-400">
              <label className="flex cursor-pointer select-none items-center gap-2">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-900 text-emerald-400 focus:ring-emerald-500"
                  {...register("remember")}
                />
                <span>Keep me signed in on this device</span>
              </label>
              <Link
                to="/auth/forgot-password"
                className="font-medium text-emerald-400 hover:text-emerald-300"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full rounded-xl bg-emerald-400 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_0_30px_rgba(16,185,129,0.7)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-300 hover:shadow-[0_18px_50px_rgba(16,185,129,0.65)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
