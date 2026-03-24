import { motion } from "framer-motion";
import clsx from "clsx";

interface ScoreRingProps {
  score: number;
  label: string;
  colorClass: string;
}

export function ScoreRing({ score, label, colorClass }: ScoreRingProps) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-8 glass-panel rounded-3xl hover:-translate-y-1 transition-transform duration-300">
      <div className="relative flex items-center justify-center w-36 h-36 mb-5">
        <svg className="w-full h-full transform -rotate-90 drop-shadow-2xl">
          {/* Background track */}
          <circle
            cx="72"
            cy="72"
            r={radius}
            className="stroke-white/5"
            strokeWidth="12"
            fill="none"
          />
          {/* Animated score ring */}
          <motion.circle
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.1 }}
            cx="72"
            cy="72"
            r={radius}
            className={colorClass}
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
            style={{ strokeDasharray: circumference }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-extrabold font-display text-foreground drop-shadow-md">
            {score}
          </span>
        </div>
      </div>
      <span className="text-sm font-bold tracking-[0.2em] text-muted-foreground uppercase">
        {label}
      </span>
    </div>
  );
}
