import React from "react";
import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  { id: 1, label: "Plan", description: "Choose subscription" },
  { id: 2, label: "Agreement", description: "Accept terms" },
  { id: 3, label: "Billing", description: "Add bank & PAN" },
  { id: 4, label: "Payment", description: "Confirm & activate" },
  { id: 5, label: "Done", description: "Start copy trading" },
];

interface Props {
  currentStep: number; // 1-5
}

const SubscriptionStepper: React.FC<Props> = ({ currentStep }) => {
  return (
    <div className="mb-8">
      <div className="flex justify-between gap-2">
        {steps.map((step, idx) => {
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;

          return (
            <div key={step.id} className="flex-1 flex flex-col items-center">
              <div className="relative flex items-center w-full">
                {/* Left connector */}
                {idx !== 0 && (
                  <div
                    className={`flex-1 h-[2px] ${
                      isCompleted || isActive
                        ? "bg-emerald-500"
                        : "bg-slate-700"
                    }`}
                  />
                )}

                {/* Node */}
                <motion.div
                  className={`flex items-center justify-center rounded-full border-2 w-8 h-8 shrink-0
                    ${
                      isCompleted
                        ? "border-emerald-500 bg-emerald-500/20"
                        : isActive
                        ? "border-emerald-400 bg-slate-900"
                        : "border-slate-700 bg-slate-900"
                    }`}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <span
                      className={`text-xs font-semibold ${
                        isActive ? "text-emerald-400" : "text-slate-400"
                      }`}
                    >
                      {step.id}
                    </span>
                  )}
                </motion.div>

                {/* Right connector */}
                {idx !== steps.length - 1 && (
                  <div
                    className={`flex-1 h-[2px] ${
                      currentStep > step.id
                        ? "bg-emerald-500"
                        : "bg-slate-700"
                    }`}
                  />
                )}
              </div>

              <div className="mt-2 text-center">
                <p
                  className={`text-xs font-semibold uppercase tracking-wide ${
                    isActive || isCompleted
                      ? "text-emerald-400"
                      : "text-slate-400"
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-[11px] text-slate-500">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubscriptionStepper;
