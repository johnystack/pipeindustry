import { cn } from "@/lib/utils";

export const LoadingScreen = ({ className }: { className?: string }) => {
  return (
    <div className={cn("min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 relative overflow-hidden", className)}>
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-emerald-500/5 rounded-full blur-[60px] pointer-events-none" />
      
      {/* Premium Bouncing Dots Loader */}
      <div className="relative flex items-center justify-center gap-3 z-10">
        <div className="w-4 h-4 bg-primary rounded-full animate-bounce [animation-delay:-0.3s] shadow-lg shadow-primary/30" />
        <div className="w-4 h-4 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s] shadow-lg shadow-emerald-500/30" />
        <div className="w-4 h-4 bg-primary/60 rounded-full animate-bounce shadow-lg shadow-primary/20" />
      </div>
    </div>
  );
};

export default LoadingScreen;
