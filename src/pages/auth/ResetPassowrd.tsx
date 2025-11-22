// ResetPasswordPage.tsx
import React from "react";
import { useForm } from "react-hook-form";
import { FiLock } from "react-icons/fi";
import { Link, useParams } from "react-router-dom";

type ResetFormValues = {
  password: string;
  confirmPassword: string;
};

const ResetPasswordPage: React.FC = () => {
  const { token } = useParams(); // reset token from backend
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetFormValues>();

  const passwordValue = watch("password");

  const onSubmit = (data: ResetFormValues) => {
    console.log("Reset password:", { token, ...data });
  };

  return (
    <div className="relative bg-slate-950 text-slate-50 pt-16  md:pt-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.22),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(99,102,241,0.18),_transparent_55%)]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-140px)] max-w-5xl items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-3xl border border-slate-800/80 bg-slate-900/90 p-6 sm:p-8 shadow-[0_20px_70px_rgba(15,23,42,0.9)] backdrop-blur-xl transition-all duration-500 hover:border-indigo-400/70">
          
          <div className="mb-6 space-y-2">
            <span className="inline-flex items-center rounded-full bg-slate-800/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
              Reset Password
            </span>
            <h2 className="text-xl sm:text-2xl font-semibold">
              Set a new password
            </h2>
            <p className="text-sm text-slate-400">
              Choose a strong new password for your account.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                New Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
                  <FiLock />
                </span>
                <input
                  type="password"
                  placeholder="Enter new password"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-10 py-2.5 text-sm text-slate-50 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                  {...register("password", {
                    required: "Password is required",
                    minLength: { value: 8, message: "Min 8 characters" },
                  })}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-rose-400">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Confirm Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
                  <FiLock />
                </span>
                <input
                  type="password"
                  placeholder="Re-enter your password"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-10 py-2.5 text-sm text-slate-50 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                  {...register("confirmPassword", {
                    required: "Confirm your password",
                    validate: (value) =>
                      value === passwordValue || "Passwords do not match",
                  })}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-rose-400">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-indigo-400 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_0_30px_rgba(99,102,241,0.6)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-indigo-300 disabled:opacity-60"
            >
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </button>
          </form>

          <div className="mt-5 text-center">
            <Link
              to="/auth/signin"
              className="text-sm text-indigo-400 hover:text-indigo-300"
            >
              Back to Login
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
