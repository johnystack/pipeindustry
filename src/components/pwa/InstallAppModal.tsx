import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Smartphone,
  Share2,
  PlusSquare,
  CheckCircle,
  Zap,
  ShieldCheck,
  Star,
  Sparkles,
  ArrowRight,
} from "lucide-react";

interface InstallAppModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promptInstall: () => void;
  hasNativePrompt: boolean;
  isIos: boolean;
  isInstalled: boolean;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  open,
  onOpenChange,
  promptInstall,
  hasNativePrompt,
  isIos,
  isInstalled,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-slate-950 border border-white/10 text-white rounded-3xl p-6 md:p-8 backdrop-blur-2xl shadow-2xl overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-48 w-48 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

        <DialogHeader className="space-y-3 text-center relative z-10">
          <div className="mx-auto relative">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-primary/20 p-1 border-2 border-emerald-500/30 shadow-2xl shadow-emerald-500/20 flex items-center justify-center">
              <img
                src="/imem.png"
                alt="Terras App Icon"
                className="h-full w-full object-cover rounded-xl"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-primary text-slate-950 p-1 rounded-full shadow-md">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
          </div>

          <div>
            <DialogTitle className="text-xl md:text-2xl font-black uppercase tracking-tight italic">
              Install Terras App
            </DialogTitle>
            <DialogDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
              Verified Commodity Trading On Your Phone
            </DialogDescription>
          </div>

          <div className="flex items-center justify-center gap-2 pt-1">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-yellow-400" />
              ))}
            </div>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider">
              4.9 • 25k+ Active Traders
            </span>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-3 relative z-10">
          {/* Key Advantages */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
              <div className="flex items-center gap-1.5 text-primary text-[10px] font-black uppercase">
                <Zap className="h-3 w-3" /> Instant Launch
              </div>
              <p className="text-[9px] text-slate-400 font-medium">Opens like a true native app without browser bars.</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-black uppercase">
                <ShieldCheck className="h-3 w-3" /> Secure Access
              </div>
              <p className="text-[9px] text-slate-400 font-medium">Protected biometric & pin lock compatible.</p>
            </div>
          </div>

          {/* Conditional Instructions */}
          {isInstalled ? (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
              <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto" />
              <p className="text-xs font-black uppercase tracking-widest text-emerald-400">
                Terras App is Already Installed!
              </p>
              <p className="text-[10px] text-slate-400">
                You can launch it directly from your device home screen or app drawer.
              </p>
            </div>
          ) : isIos ? (
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3">
              <div className="flex items-center gap-2">
                <Badge className="bg-primary/20 text-primary border-primary/30 text-[9px] font-black uppercase">
                  iOS / Safari Setup
                </Badge>
                <span className="text-[10px] font-bold text-slate-300">2 Easy Steps</span>
              </div>
              <ol className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-start gap-2.5">
                  <span className="h-5 w-5 rounded-full bg-primary/20 text-primary font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    Tap the <strong className="text-white">Share</strong> button{" "}
                    <Share2 className="inline h-3.5 w-3.5 text-primary mx-0.5" /> in your Safari bottom bar.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="h-5 w-5 rounded-full bg-primary/20 text-primary font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    Scroll down and select{" "}
                    <strong className="text-emerald-400">Add to Home Screen</strong>{" "}
                    <PlusSquare className="inline h-3.5 w-3.5 text-emerald-400 mx-0.5" />, then tap <strong>Add</strong>.
                  </span>
                </li>
              </ol>
            </div>
          ) : hasNativePrompt ? (
            <div className="space-y-3">
              <Button
                onClick={promptInstall}
                className="w-full h-12 rounded-xl bg-primary hover:bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
              >
                <Download className="h-4 w-4" />
                <span>Install App Immediately</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
              <p className="text-[9px] text-center text-slate-500 font-bold uppercase tracking-wider">
                Instant installation • No app store login required
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-primary" />
                <span className="text-xs font-black uppercase text-white">Direct Browser Install</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Tap your browser menu (<strong className="text-white">? 3 dots</strong> or <strong className="text-white">Share</strong>) and click{" "}
                <strong className="text-emerald-400">"Install app"</strong> or <strong className="text-emerald-400">"Add to Home Screen"</strong>.
              </p>
              <Button
                onClick={promptInstall}
                variant="outline"
                className="w-full h-10 rounded-xl border-white/10 text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/5"
              >
                <Download className="h-3.5 w-3.5 mr-2" />
                Try Install Prompt
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
