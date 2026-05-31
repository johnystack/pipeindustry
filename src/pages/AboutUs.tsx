import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { TrendingUp, ShieldCheck, Zap, Globe, Users, Award } from "lucide-react";

const AboutUs: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-primary/30">
      <div className="container mx-auto py-10 md:py-20 px-4 md:px-6 space-y-16 md:space-y-20">
        
        {/* Hero Section */}
        <section className="text-center space-y-6 max-w-4xl mx-auto pt-4 md:pt-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest animate-fade-in">
            <TrendingUp className="h-4 w-4" /> Global Infrastructure
          </div>
          <h1 className="text-3xl md:text-6xl font-black tracking-tighter uppercase italic leading-[1.1]">
            Elite Commodity Trading <br />
            <span className="text-primary">Redefined.</span>
          </h1>
          <p className="text-sm md:text-lg text-slate-400 leading-relaxed font-medium">
            TerrasInvestment is a Tier-1 commodity exchange platform designed for high-stakes traders 
            and verified suppliers. We bridge the gap between global liquid assets and strategic growth.
          </p>
          <div className="pt-4">
            <Link to="/signup">
                <Button size="lg" className="h-14 px-10 rounded-xl bg-primary text-primary-foreground font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all">
                    Initialize Trade Identity
                </Button>
            </Link>
          </div>
        </section>

        {/* Core Pillars */}
        <section className="grid md:grid-cols-3 gap-6 md:gap-8">
            {[
                { icon: ShieldCheck, title: "Verified Assets", desc: "Every commodity unit on our platform is backed by physical reserves and blockchain verification." },
                { icon: Zap, title: "Liquid Growth", desc: "Optimized 24-day cycles with 4-day claim intervals ensure your capital remains working for you." },
                { icon: Globe, title: "Global Reach", desc: "Connecting verified vendors from the world's most resource-rich regions with strategic investors." }
            ].map((pillar, i) => (
                <Card key={i} className="bg-slate-900/40 border-white/5 p-8 rounded-[2rem] hover:border-primary/30 transition-all group">
                    <CardHeader className="p-0 space-y-4">
                        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <pillar.icon className="h-7 w-7 text-primary" />
                        </div>
                        <CardTitle className="text-lg font-black uppercase italic text-white tracking-tight">{pillar.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 pt-4">
                        <p className="text-sm text-slate-400 leading-relaxed">{pillar.desc}</p>
                    </CardContent>
                </Card>
            ))}
        </section>

        {/* Mission Statement */}
        <section className="relative">
          <div className="absolute inset-0 bg-primary/5 rounded-[3rem] blur-3xl -z-10" />
          <Card className="w-full max-w-5xl mx-auto bg-slate-900/60 border-white/10 shadow-2xl rounded-[3rem] overflow-hidden">
            <CardHeader className="p-10 md:p-16 text-center border-b border-white/5 bg-white/[0.02]">
              <CardTitle className="text-3xl md:text-5xl font-black uppercase italic text-white tracking-tighter">
                Our Mission
              </CardTitle>
              <CardDescription className="text-xs md:text-sm font-bold text-primary uppercase tracking-[0.3em] mt-4">
                Democratizing Institutional Grade Commodity Trading
              </CardDescription>
            </CardHeader>
            <CardContent className="p-10 md:p-16 space-y-8 text-sm md:text-lg leading-relaxed text-slate-300 max-w-4xl mx-auto">
              <p>
                At TerrasInvestment, our mission is to provide an elite gateway to robust investment portfolios, 
                ensuring every strategic trader has the opportunity to capitalize on emerging commodity trends. 
                We are committed to a platform where transparency, security, and exceptional returns are 
                guaranteed operational realities.
              </p>
              <p>
                We leverage multi-signature escrow technology and a team of seasoned financial analysts 
                to maintain a marketplace of verified high-yield opportunities. Our standardized 24-day 
                trade cycle ensures consistency and predictability in global commodity wealth creation.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-10 border-t border-white/5">
                {[
                    { label: "Asset Value", val: "$12M+" },
                    { label: "Vendors", val: "450+" },
                    { label: "Uptime", val: "99.9%" },
                    { label: "Status", val: "Tier-1" }
                ].map((s, i) => (
                    <div key={i} className="text-center">
                        <div className="text-2xl font-black text-white italic">{s.val}</div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{s.label}</div>
                    </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CTA */}
        <section className="text-center bg-gradient-to-br from-primary/10 to-emerald-500/5 py-12 md:py-16 rounded-[3rem] border border-white/5 shadow-2xl">
          <h2 className="text-2xl md:text-5xl font-black mb-6 uppercase italic text-white tracking-tighter">
            Ready for <span className="text-primary">Elite</span> Status?
          </h2>
          <p className="text-sm md:text-lg text-slate-400 max-w-2xl mx-auto mb-10 font-medium">
            Join the global network of traders building their financial future with physical asset security.
          </p>
          <Link to="/signup">
            <Button size="lg" className="h-16 px-12 rounded-xl bg-primary text-primary-foreground font-black text-sm uppercase tracking-widest shadow-glow hover:scale-105 transition-all">
              Initialize Your First Trade
            </Button>
          </Link>
        </section>
      </div>
    </div>
  );
};

export default AboutUs;
