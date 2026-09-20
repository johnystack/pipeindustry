import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Copy,
  Check,
  Laptop,
  AlertTriangle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface InstallAppModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promptInstall: () => void;
  hasNativePrompt: boolean;
  isIos: boolean;
  isAndroid?: boolean;
  isMobile?: boolean;
  isInAppBrowser?: boolean;
  browserName?: string;
  isInstalled: boolean;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  open,
  onOpenChange,
  promptInstall,
  hasNativePrompt,
  isIos,
  isAndroid = false,
  isInAppBrowser = false,
  browserName = "Browser",
  isInstalled,
}) => {
  const [copied, setCopied] = useState(false);
  
  // Set default tab based on platform
  const defaultTab = isIos ? "ios" : isAndroid ? "android" : "desktop";
  const [activeTab, setActiveTab] = useState<string>(defaultTab);

  useEffect(() => {
    if (open) {
      setActiveTab(isIos ? "ios" : isAndroid ? "android" : "desktop");
    }
  }, [open, isIos, isAndroid]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.origin);
      setCopied(true);
      toast({
        title: "Link Copied!",
        description: "Open Chrome or Safari on your phone and paste the link to install.",
      });
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleTriggerPrompt = () => {
    promptInstall();
    if (!hasNativePrompt) {
      toast({
        title: "Manual Install Tip",
        description: "If your browser does not pop up automatically, tap the 3 dots or Share button and select 'Install app' or 'Add to Home screen'.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-slate-950 border border-white/10 text-white rounded-3xl p-5 md:p-7 backdrop-blur-2xl shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto">
        {/* Background glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-48 w-48 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

        <DialogHeader className="space-y-3 text-center relative z-10">
          <div className="mx-auto relative">
            <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-primary/20 p-1 border-2 border-emerald-500/30 shadow-2xl shadow-emerald-500/20 flex items-center justify-center">
              <img
                src="/icon-192.png"
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
              Direct Mobile Installation For Your Phone
            </DialogDescription>
          </div>

          <div className="flex items-center justify-center gap-2 pt-0.5">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-yellow-400" />
              ))}
            </div>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider">
              4.9 - 25k+ Active Mobile Traders
            </span>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 relative z-10">
          {/* In-App Browser Warning Banner (WhatsApp, Instagram, etc.) */}
          {isInAppBrowser && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-left space-y-2">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase tracking-wider">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Opened inside Social App ({browserName})</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Social app browsers (like WhatsApp, Instagram) do not allow direct phone installation.
                Tap your browser menu (<strong className="text-white">three dots</strong> or <strong className="text-white">Share</strong>) and choose{" "}
                <strong className="text-amber-300">"Open in Chrome"</strong> or <strong className="text-amber-300">"Open in Safari"</strong>.
              </p>
              <Button
                onClick={handleCopyLink}
                size="sm"
                variant="outline"
                className="w-full h-8 text-[10px] font-black uppercase tracking-wider border-amber-500/30 text-amber-300 hover:bg-amber-500/10 flex items-center justify-center gap-2"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Link Copied! Open Chrome/Safari" : "Copy Website Link"}
              </Button>
            </div>
          )}

          {/* Key Advantages */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
              <div className="flex items-center gap-1.5 text-primary text-[10px] font-black uppercase">
                <Zap className="h-3 w-3" /> 1-Tap Mobile Install
              </div>
              <p className="text-[9px] text-slate-400 font-medium">Adds real app icon to home screen and app drawer.</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-black uppercase">
                <ShieldCheck className="h-3 w-3" /> 100% Native Mode
              </div>
              <p className="text-[9px] text-slate-400 font-medium">Fast fullscreen experience with zero browser bars.</p>
            </div>
          </div>

          {/* Conditional Content */}
          {isInstalled ? (
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
              <CheckCircle className="h-10 w-10 text-emerald-400 mx-auto" />
              <p className="text-sm font-black uppercase tracking-widest text-emerald-400">
                Terras App is Already Installed!
              </p>
              <p className="text-xs text-slate-300">
                You can launch it anytime directly from your phone home screen or app drawer.
              </p>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3 bg-slate-900/90 border border-white/10 p-1 rounded-xl">
                <TabsTrigger
                  value="android"
                  className="rounded-lg text-[10px] font-black uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-slate-950"
                >
                  <Smartphone className="h-3.5 w-3.5 mr-1" />
                  Android
                </TabsTrigger>
                <TabsTrigger
                  value="ios"
                  className="rounded-lg text-[10px] font-black uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-slate-950"
                >
                  <Smartphone className="h-3.5 w-3.5 mr-1" />
                  iPhone
                </TabsTrigger>
                <TabsTrigger
                  value="desktop"
                  className="rounded-lg text-[10px] font-black uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-slate-950"
                >
                  <Laptop className="h-3.5 w-3.5 mr-1" />
                  PC / Mac
                </TabsTrigger>
              </TabsList>

              {/* Android Instructions */}
              <TabsContent value="android" className="space-y-3 pt-3">
                {hasNativePrompt ? (
                  <div className="space-y-3">
                    <Button
                      onClick={handleTriggerPrompt}
                      className="w-full h-12 rounded-xl bg-primary hover:bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
                    >
                      <Download className="h-4 w-4" />
                      <span>Install App on Android Phone</span>
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                    <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-wider">
                      1-Tap direct installation - Generates official phone app
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3 text-left">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-primary/20 text-primary border-primary/30 text-[9px] font-black uppercase">
                          Android (Chrome / Samsung)
                        </Badge>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">3 Seconds</span>
                    </div>

                    <ol className="space-y-2.5 text-xs text-slate-300">
                      <li className="flex items-start gap-2.5">
                        <span className="h-5 w-5 rounded-full bg-primary/20 text-primary font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          1
                        </span>
                        <span>
                          Tap the <strong className="text-white">three dots menu</strong> in the top-right corner of your browser.
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="h-5 w-5 rounded-full bg-primary/20 text-primary font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          2
                        </span>
                        <span>
                          Select <strong className="text-emerald-400">"Install app"</strong> or <strong className="text-emerald-400">"Add to Home screen"</strong>.
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="h-5 w-5 rounded-full bg-primary/20 text-primary font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          3
                        </span>
                        <span>
                          Tap <strong className="text-white">Install</strong> to confirm. The Terras app will immediately appear on your phone home screen!
                        </span>
                      </li>
                    </ol>

                    <Button
                      onClick={handleTriggerPrompt}
                      className="w-full h-11 rounded-xl bg-primary hover:bg-emerald-500 text-slate-950 font-black text-[10px] uppercase tracking-widest transition-all mt-2 flex items-center justify-center gap-2"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Trigger Install Popup Now</span>
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* iOS / iPhone Instructions */}
              <TabsContent value="ios" className="space-y-3 pt-3">
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3 text-left">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-primary/20 text-primary border-primary/30 text-[9px] font-black uppercase">
                      iPhone / iPad (Safari)
                    </Badge>
                    <span className="text-[10px] font-bold text-slate-400">2 Quick Steps</span>
                  </div>

                  <ol className="space-y-2.5 text-xs text-slate-300">
                    <li className="flex items-start gap-2.5">
                      <span className="h-5 w-5 rounded-full bg-primary/20 text-primary font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </span>
                      <span>
                        Tap the <strong className="text-white">Share button</strong>{" "}
                        <Share2 className="inline h-3.5 w-3.5 text-primary mx-0.5" /> in your Safari bottom bar.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="h-5 w-5 rounded-full bg-primary/20 text-primary font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </span>
                      <span>
                        Scroll down the menu and tap{" "}
                        <strong className="text-emerald-400">"Add to Home Screen"</strong>{" "}
                        <PlusSquare className="inline h-3.5 w-3.5 text-emerald-400 mx-0.5" />, then tap <strong className="text-white">Add</strong> at top right.
                      </span>
                    </li>
                  </ol>

                  <div className="pt-1 text-[10px] text-slate-400 font-medium">
                    Works on all iOS devices. Runs in full-screen native app mode.
                  </div>
                </div>
              </TabsContent>

              {/* Desktop Instructions */}
              <TabsContent value="desktop" className="space-y-3 pt-3">
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3 text-left">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary/20 text-primary border-primary/30 text-[9px] font-black uppercase">
                      Windows / Mac Desktop
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Install Terras directly to your Windows desktop or Mac dock for high-speed trading and offline access.
                  </p>
                  <Button
                    onClick={handleTriggerPrompt}
                    className="w-full h-11 rounded-xl bg-primary hover:bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/25 transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Install to Desktop</span>
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};