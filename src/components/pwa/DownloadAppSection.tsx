import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Smartphone,
  Zap,
  ShieldCheck,
  TrendingUp,
  CheckCircle,
  Gem,
  Bell,
  Wallet,
  Sparkles,
  ArrowDownToLine,
  HelpCircle,
} from "lucide-react";

interface DownloadAppSectionProps {
  onInstallClick: () => void;
  isInstalled: boolean;
  isMobile?: boolean;
  isAndroid?: boolean;
  isIos?: boolean;
}

export const DownloadAppSection: React.FC<DownloadAppSectionProps> = ({
  onInstallClick,
  isInstalled,
  isMobile = false,
  isAndroid = false,
  isIos = false,
}) => {
  return (
    <section id="download-app" className="py-12 md:py-20 px-4 md:px-6 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto max-w-6xl">
        <div className="relative rounded-[2rem] md:rounded-[3rem] border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-950 to-slate-950 p-6 md:p-14 overflow-hidden shadow-2xl backdrop-blur-xl">
          {/* Subtle grid pattern overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[8px] md:text-xs font-black uppercase tracking-[0.2em]">
                <Smartphone className="h-3.5 w-3.5" />
                Mobile Application (Android & iOS)
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-white tracking-tighter uppercase italic leading-[1.05]">
                DOWNLOAD & INSTALL <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-400 to-primary">
                  TERRAS MOBILE APP
                </span>
              </h2>

              <p className="text-xs md:text-base text-slate-300 font-medium leading-relaxed max-w-xl">
                Get the verified Terras Commodity Platform installed directly on your Android or iPhone. Fast, lightweight, runs in full native mode with instant claim notifications and zero app store waiting.
              </p>

              {/* Feature highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-white tracking-tight">One-Tap Install</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Installs right to your home screen in 3 seconds.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-white tracking-tight">Full Native Mode</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Runs fullscreen without browser tabs or address bars.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 shrink-0">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-white tracking-tight">Milestone Alerts</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Instant alerts when 4-day claim cycles are ready.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 shrink-0">
                    <Wallet className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-white tracking-tight">Rapid Liquidations</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Request bank & crypto withdrawals directly on mobile.</p>
                  </div>
                </div>
              </div>

              {/* Action Button & Platform Support */}
              <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Button
                  onClick={onInstallClick}
                  className="h-12 md:h-14 px-8 rounded-xl bg-primary hover:bg-emerald-500 text-slate-950 font-black text-xs md:text-sm uppercase tracking-widest shadow-2xl shadow-primary/30 transition-all hover:scale-105 flex items-center gap-3"
                >
                  <ArrowDownToLine className="h-5 w-5" />
                  <span>
                    {isInstalled
                      ? "Open Mobile App"
                      : isAndroid
                      ? "Install on Android Phone"
                      : isIos
                      ? "Install on iPhone / iPad"
                      : "Download & Install App"}
                  </span>
                </Button>

                <div className="flex items-center gap-3 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle className="h-3.5 w-3.5" /> Android Phone
                  </span>
                  <span>-</span>
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle className="h-3.5 w-3.5" /> iPhone / iPad
                  </span>
                  <span>-</span>
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <CheckCircle className="h-3.5 w-3.5 text-primary" /> Desktop
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Modern Smartphone Mockup */}
            <div className="lg:col-span-5 flex justify-center relative">
              {/* Phone Frame */}
              <div className="relative w-64 md:w-72 rounded-[2.5rem] border-4 border-slate-800 bg-slate-950 p-3 shadow-[0_0_50px_-10px_rgba(5,150,105,0.3)] transition-transform hover:scale-105 duration-500">
                {/* Dynamic island / speaker pill */}
                <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-slate-900 mr-2" />
                  <div className="w-8 h-1 rounded-full bg-slate-900" />
                </div>

                {/* Simulated App Screen */}
                <div className="rounded-[1.8rem] bg-slate-900/90 border border-white/10 p-3.5 space-y-3 overflow-hidden text-left">
                  {/* Mini App Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-lg bg-primary/20 p-1 flex items-center justify-center">
                        <TrendingUp className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span className="text-[10px] font-black text-white uppercase italic">Terras</span>
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-400 text-[7px] font-black uppercase px-1.5 py-0">
                      Live
                    </Badge>
                  </div>

                  {/* Portfolio Card */}
                  <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white space-y-1 shadow-lg">
                    <p className="text-[7px] font-black uppercase tracking-widest text-emerald-100/70">Liquid Assets</p>
                    <p className="text-base font-black italic tracking-tight">$1,250,000</p>
                    <div className="pt-1 flex items-center justify-between text-[7px] font-bold text-emerald-100/90">
                      <span>Ready to Claim</span>
                      <span className="bg-white/20 px-1.5 py-0.5 rounded uppercase font-black">Stage 1/6</span>
                    </div>
                  </div>

                  {/* Active Trade Simulation */}
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1.5">
                    <div className="flex justify-between items-center text-[8px] font-black uppercase">
                      <span className="text-white flex items-center gap-1">
                        <Gem className="h-2.5 w-2.5 text-primary" /> Lithium Trade
                      </span>
                      <span className="text-emerald-400">+50% Target</span>
                    </div>
                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-primary h-full w-1/3 rounded-full" />
                    </div>
                    <p className="text-[7px] text-slate-400 font-bold uppercase tracking-wider">
                      Cycle: Day 4/24 - Next Claim: 0 Days
                    </p>
                  </div>

                  {/* Claim Button Simulation */}
                  <div className="w-full py-2 bg-primary text-slate-950 rounded-lg text-center font-black text-[9px] uppercase tracking-wider shadow-md">
                    Claim $250,000 Now
                  </div>
                </div>

                {/* Home Indicator bar */}
                <div className="w-28 h-1 bg-slate-700 rounded-full mx-auto mt-3" />
              </div>

              {/* Floating App Badge */}
              <div className="absolute -bottom-4 -left-4 md:-left-6 p-2.5 md:p-3 rounded-2xl bg-slate-900/95 border border-primary/30 shadow-2xl backdrop-blur-xl flex items-center gap-2.5 z-20 animate-bounce duration-1000">
                <div className="p-1.5 rounded-xl bg-primary text-slate-950">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-white">Direct Mobile App</p>
                  <p className="text-[8px] text-primary font-bold">100% Free - Works on Android & iOS</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};