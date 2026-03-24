import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background pointer-events-none" />
      <div className="absolute top-[20%] left-[20%] w-[30%] h-[30%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-8 relative z-10"
      >
        <h1 className="text-8xl md:text-[12rem] font-display font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-foreground to-foreground/20 leading-none">
          404
        </h1>
        <p className="text-2xl text-muted-foreground font-medium">
          The space you're looking for doesn't exist.
        </p>
        <Link 
          href="/" 
          className="inline-flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-foreground font-bold transition-all hover:scale-105 active:scale-95"
        >
          Return to Dashboard <ArrowRight className="w-5 h-5 text-primary" />
        </Link>
      </motion.div>
    </div>
  );
}
