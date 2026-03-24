import { motion } from "framer-motion";
import { type ReactNode } from "react";
import clsx from "clsx";

interface ScoreRingProps {
  score: number;
  label: string;
  colorClass: string;
  glowColor: string;
  icon: ReactNode;
  description?: string;
}

function getScoreLabel(score: number) {
  if (score >= 80) return { text: "Excellent", color: "text-emerald-600" };
  if (score >= 60) return { text: "Good",      color: "text-blue-600" };
  if (score >= 40) return { text: "Fair",      color: "text-amber-600" };
  return                   { text: "Poor",     color: "text-red-600" };
}

export function ScoreRing({ score, label, colorClass, icon, description }: ScoreRingProps) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const rating = getScoreLabel(score);

  return (
    <div className="flex flex-col items-center p-6 bg-white border border-gray-200 shadow-sm rounded-2xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      {/* Label + icon */}
      <div className="mb-4 flex items-center gap-2">
        <span className="text-gray-400">{icon}</span>
        <span className="text-xs font-bold tracking-[0.15em] text-gray-500 uppercase">{label}</span>
      </div>

      {/* Ring */}
      <div className="relative flex items-center justify-center w-28 h-28 mb-3">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="56" cy="56" r={radius}
            stroke="#e5e7eb"
            strokeWidth="10" fill="none"
          />
          <motion.circle
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.4, ease: "easeOut", delay: 0.15 }}
            cx="56" cy="56" r={radius}
            className={colorClass}
            strokeWidth="10" fill="none"
            strokeLinecap="round"
            style={{ strokeDasharray: circumference }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-3xl font-extrabold text-gray-900 tabular-nums"
          >
            {score}
          </motion.span>
          <span className="text-[10px] text-gray-400 font-medium">/100</span>
        </div>
      </div>

      {/* Rating */}
      <span className={clsx("text-xs font-bold", rating.color)}>{rating.text}</span>

      {description && (
        <p className="mt-1.5 text-[11px] text-center text-gray-400 leading-snug max-w-[120px]">
          {description}
        </p>
      )}
    </div>
  );
}
