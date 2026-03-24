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
  if (score >= 80) return { text: "Excellent", color: "text-emerald-400" };
  if (score >= 60) return { text: "Good", color: "text-blue-400" };
  if (score >= 40) return { text: "Fair", color: "text-amber-400" };
  return { text: "Poor", color: "text-red-400" };
}

export function ScoreRing({ score, label, colorClass, glowColor, icon, description }: ScoreRingProps) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const rating = getScoreLabel(score);

  return (
    <div className="relative flex flex-col items-center p-6 glass-panel rounded-3xl hover:-translate-y-1 transition-transform duration-300 overflow-hidden group">
      {/* Subtle glow behind the ring */}
      <div className={clsx("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl", glowColor)} />

      {/* Icon badge */}
      <div className="relative z-10 mb-4 flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-xs font-bold tracking-[0.18em] text-muted-foreground uppercase">{label}</span>
      </div>

      {/* Ring */}
      <div className="relative z-10 flex items-center justify-center w-28 h-28 mb-3">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="56" cy="56" r={radius}
            className="stroke-white/5"
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
            className="text-3xl font-extrabold text-foreground tabular-nums"
          >
            {score}
          </motion.span>
          <span className="text-[10px] text-muted-foreground font-medium">/100</span>
        </div>
      </div>

      {/* Rating label */}
      <span className={clsx("relative z-10 text-xs font-bold", rating.color)}>{rating.text}</span>

      {description && (
        <p className="relative z-10 mt-1.5 text-[11px] text-center text-muted-foreground/60 leading-snug max-w-[120px]">
          {description}
        </p>
      )}
    </div>
  );
}
