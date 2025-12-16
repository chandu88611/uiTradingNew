// SignUpPage.tsx
import React from "react";
import { useForm } from "react-hook-form";
import { FiMail, FiLock, FiUser } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { useRegisterMutation } from "../../services/userApi";
import GoogleButton from "./GoogleButton";
import { toast } from "react-toastify";
import { consumeAuthReturnTo } from "../../utils/authReturn";

type SignUpFormValues = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agree: boolean;
};

type Props = {
  mode?: "page" | "modal";
  onAuthed?: () => void;
  onSwitchToSignin?: () => void;
};

const SignUpPage: React.FC<Props> = ({ mode = "page", onAuthed, onSwitchToSignin }) => {
  const navigate = useNavigate();
  const [registerUser, { isLoading }] = useRegisterMutation();

  const {
    register,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormValues>();

  const passwordValue = watch("password");

  const afterAuth = () => {
    if (onAuthed) return onAuthed();
    navigate(consumeAuthReturnTo("/profile"));
  };

  const onSubmit = async (data: SignUpFormValues) => {
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        name: data.fullName,
      }).unwrap();

      afterAuth();
    } catch (err: any) {
      toast.error(err?.data?.message || "Signup failed");
    }
  };

  return (
    <div className={`relative bg-slate-950 text-slate-50 ${mode === "page" ? "pt-16 md:pt-28" : "pt-6"}`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(56,189,248,0.16),_transparent_55%)]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-140px)] max-w-5xl items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-3xl border border-slate-800/80 bg-slate-900/90 p-6 sm:p-8 shadow-[0_20px_70px_rgba(15,23,42,0.9)] backdrop-blur-xl transition-all duration-500 hover:border-emerald-400/70 hover:shadow-[0_0_90px_rgba(16,185,129,0.45)]">
          <div className="mb-6 space-y-2">
            <span className="inline-flex items-center rounded-full bg-slate-800/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300/90">
              Create account
            </span>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
              Get started with{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-300 bg-clip-text text-transparent">
                TradebroX
              </span>
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Already have an account?{" "}
              {mode === "modal" ? (
                <button
                  type="button"
                  onClick={onSwitchToSignin}
                  className="font-medium text-emerald-400 hover:text-emerald-300"
                >
                  Sign in
                </button>
              ) : (
                <Link
                  to="/auth/signin"
                  className="font-medium text-emerald-400 hover:text-emerald-300"
                >
                  Sign in
                </Link>
              )}
            </p>
          </div>

          <div className="mb-5">
            <GoogleButton onSuccess={afterAuth} />
          </div>

          <div className="mb-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-700/70" />
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">or</span>
            <div className="h-px flex-1 bg-slate-700/70" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Full name</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">
                  <FiUser />
                </span>
                <input
                  type="text"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-10 py-2.5 text-sm text-slate-50 placeholder:text-slate-500 outline-none transition-all duration-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                  placeholder="e.g. Rahul Sharma"
                  {...register("fullName", { required: "Full name is required", minLength: { value: 2, message: "Too short" } })}
                />
              </div>
              {errors.fullName && <p className="mt-0.5 text-xs text-rose-400">{errors.fullName.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Email address</label>
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
                    pattern: { value: /\S+@\S+\.\S+/, message: "Enter a valid email" },
                  })}
                />
              </div>
              {errors.email && <p className="mt-0.5 text-xs text-rose-400">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Password</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">
                  <FiLock />
                </span>
                <input
                  type="password"
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-10 py-2.5 text-sm text-slate-50 placeholder:text-slate-500 outline-none transition-all duration-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                  placeholder="Create a strong password"
                  {...register("password", { required: "Password is required", minLength: { value: 8, message: "At least 8 characters" } })}
                />
              </div>
              {errors.password && <p className="mt-0.5 text-xs text-rose-400">{errors.password.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Confirm password</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">
                  <FiLock />
                </span>
                <input
                  type="password"
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-10 py-2.5 text-sm text-slate-50 placeholder:text-slate-500 outline-none transition-all duration-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                  placeholder="Re-enter your password"
                  {...register("confirmPassword", {
                    required: "Please confirm your password",
                    validate: (value) => value === passwordValue || "Passwords do not match",
                  })}
                />
              </div>
              {errors.confirmPassword && <p className="mt-0.5 text-xs text-rose-400">{errors.confirmPassword.message}</p>}
            </div>

            <div className="text-xs text-slate-400">
              <label className="flex cursor-pointer select-none items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-0.5 h-3.5 w-3.5 rounded border-slate-600 bg-slate-900 text-emerald-400 focus:ring-emerald-500"
                  {...register("agree", { required: "You must accept the terms to continue" })}
                />
                <span>
                  I have read and agree to the{" "}
                  <span className="text-emerald-400">Terms of Use, Privacy Policy</span>{" "}
                  and understand that trading &amp; copy-trading involve risk.
                </span>
              </label>
              {errors.agree && <p className="mt-1 text-xs text-rose-400">{errors.agree.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="mt-1 w-full rounded-xl bg-emerald-400 text-sm font-semibold text-slate-950 py-2.5 shadow-[0_0_30px_rgba(16,185,129,0.7)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-300 hover:shadow-[0_18px_50px_rgba(16,185,129,0.65)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting || isLoading ? "Creating account..." : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
