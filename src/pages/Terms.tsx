import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Scale, Info, AlertCircle, Clock, Zap } from "lucide-react";

const Terms = () => {
  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic text-white">Platform Rules & Policies</h1>
          <p className="text-[10px] md:text-xs font-black text-primary uppercase tracking-[0.3em]">Binding Agreement for Elite Commodity Trading</p>
        </div>

        <Card className="bg-slate-900/50 border-white/10 shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-8 border-b border-white/5 bg-primary/5">
            <CardTitle className="text-xl font-black uppercase flex items-center gap-3 italic text-white">
              <Scale className="h-6 w-6 text-primary" /> Terms of Service
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 md:p-12 space-y-12 text-slate-300">
            
            {/* 1. Core Logic */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <Clock className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-black uppercase tracking-tight italic text-white">1. Investment & Maturity Cycle</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-3">
                  <h3 className="text-xs font-black uppercase text-white tracking-widest">Standard Duration</h3>
                  <p className="text-sm leading-relaxed">All commodity investment plans operate on a strictly standardized cycle of **24 days**. Once initiated, the capital is committed to the trade for this duration.</p>
                </div>
                <div className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-3">
                  <h3 className="text-xs font-black uppercase text-white tracking-widest">Claim Intervals</h3>
                  <p className="text-sm leading-relaxed">Assets are made available for claiming at **4-day intervals**. Users may claim their accumulated Capital + Profit on Days 4, 8, 12, 16, 20, and 24.</p>
                </div>
              </div>
            </div>

            {/* 2. Fee Structure */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <Zap className="h-5 w-5 text-emerald-500" />
                <h2 className="text-lg font-black uppercase tracking-tight italic text-white">2. Fee & Commission Structure</h2>
              </div>
              <div className="space-y-4">
                <div className="p-6 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 space-y-4">
                  <p className="text-sm leading-relaxed">TerrasInvestment operates on a "Profit First" model. To ensure high liquidity for our traders:</p>
                  <ul className="space-y-3">
                    <li className="flex gap-3 text-sm italic">
                      <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>**Interim Withdrawals (Claims 1-5)** are **100% FREE** with zero platform fees.</span>
                    </li>
                    <li className="flex gap-3 text-sm italic">
                      <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>A **One-time Commission Fee of 6.67%** is applied only upon the successful completion of the 24-day cycle.</span>
                    </li>
                  </ul>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-2">* This commission is deducted automatically from the withdrawal balance following the 6th claim.</p>
                </div>
              </div>
            </div>

            {/* 3. User Roles */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <Info className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-black uppercase tracking-tight italic text-white">3. Trader & Vendor Responsibilities</h2>
              </div>
              <div className="space-y-4">
                <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                  <h4 className="text-xs font-black uppercase text-white mb-2 tracking-widest">For Traders</h4>
                  <p className="text-sm leading-relaxed">Traders must provide accurate bank details for settlements. The platform is not responsible for funds sent to incorrectly provided coordinates.</p>
                </div>
                <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                  <h4 className="text-xs font-black uppercase text-white mb-2 tracking-widest">For Vendors</h4>
                  <p className="text-sm leading-relaxed">Vendors are third-party suppliers of commodities. They are required to pass a blockchain-verified KYC process and maintain sufficient liquidity to back their posted trade plans.</p>
                </div>
              </div>
            </div>

            {/* 4. Security */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-black uppercase tracking-tight italic text-white">4. Secure Escrow & Risk Disclosure</h2>
              </div>
              <p className="text-sm leading-relaxed px-2">
                All investment capital is held in a secure, multi-signature escrow system. Funds are only released to vendors once specific trade milestones are reached. While we strictly verify all assets, commodity trading involves market risks. By using this platform, you acknowledge and accept these operational parameters.
              </p>
            </div>

            <div className="pt-10 text-center">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Last Updated: May 2026 • TerrasInvestment Compliance Core</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Terms;
