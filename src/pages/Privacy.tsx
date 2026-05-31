import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Eye, Database, ShieldAlert, Globe } from "lucide-react";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic text-white">Privacy Architecture</h1>
          <p className="text-[10px] md:text-xs font-black text-primary uppercase tracking-[0.3em]">Data Protection & Security Protocols</p>
        </div>

        <Card className="bg-slate-900/50 border-white/10 shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-8 border-b border-white/5 bg-primary/5">
            <CardTitle className="text-xl font-black uppercase flex items-center gap-3 italic text-white">
              <Lock className="h-6 w-6 text-primary" /> Privacy Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 md:p-12 space-y-12 text-slate-300">
            
            {/* 1. Data Collection */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <Database className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-black uppercase tracking-tight italic text-white">1. Information Acquisition</h2>
              </div>
              <p className="text-sm leading-relaxed px-2">
                We collect personal identifiers (Name, Email, Bank Coordinates) strictly necessary for trade execution and secure financial settlements. For Vendors, we additionaly collect business verification documents as part of our Tier-1 KYC protocol.
              </p>
            </div>

            {/* 2. Cryptographic Protection */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <ShieldAlert className="h-5 w-5 text-emerald-500" />
                <h2 className="text-lg font-black uppercase tracking-tight italic text-white">2. Encryption & Storage</h2>
              </div>
              <div className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                <p className="text-sm leading-relaxed">Your data is secured using advanced cryptographic standards:</p>
                <ul className="grid md:grid-cols-2 gap-4">
                  <li className="flex items-start gap-2 text-xs font-bold uppercase tracking-tight">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1" />
                    AES-256 Bank Detail Encryption
                  </li>
                  <li className="flex items-start gap-2 text-xs font-bold uppercase tracking-tight">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1" />
                    End-to-End SSL Transmission
                  </li>
                  <li className="flex items-start gap-2 text-xs font-bold uppercase tracking-tight">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1" />
                    Bcrypt Password Hashing
                  </li>
                  <li className="flex items-start gap-2 text-xs font-bold uppercase tracking-tight">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1" />
                    Isolated Escrow Databases
                  </li>
                </ul>
              </div>
            </div>

            {/* 3. Usage Policy */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <Eye className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-black uppercase tracking-tight italic text-white">3. Information Utilization</h2>
              </div>
              <p className="text-sm leading-relaxed px-2">
                Your information is used exclusively to: Process investment claims, authorize bank withdrawals, prevent fraudulent multi-accounting, and maintain vendor accountability. We **NEVER** sell or trade user data to third-party marketing entities.
              </p>
            </div>

            {/* 4. Global Compliance */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <Globe className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-black uppercase tracking-tight italic text-white">4. Compliance & Control</h2>
              </div>
              <p className="text-sm leading-relaxed px-2">
                Users maintain full control over their core data through the Security Rotation console. You may request account decommissioning and data erasure at any time, subject to the settlement of any active trades.
              </p>
            </div>

            <div className="pt-10 text-center">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">TerrasInvestment Security Core • Elite Status Protected</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Privacy;
