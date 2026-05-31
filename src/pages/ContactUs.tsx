import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Globe, MessageSquare, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

const ContactUs: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-primary/30">
      <div className="container mx-auto py-20 px-4 md:px-6 space-y-20">
        
        {/* Hero Section */}
        <section className="text-center space-y-6 max-w-3xl mx-auto pt-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest animate-fade-in">
            <MessageSquare className="h-4 w-4" /> Support Core
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic leading-[1.1]">
            Global <span className="text-primary">Liaison.</span>
          </h1>
          <p className="text-sm md:text-lg text-slate-400 leading-relaxed font-medium">
            Our support infrastructure is available 24/7 to authorize your inquiries 
            and ensure seamless operational continuity.
          </p>
        </section>

        {/* Contact Grid */}
        <section className="grid md:grid-cols-3 gap-8">
            {[
                { icon: Mail, title: "Identity Auth", val: "terrasinvestment@gmail.com", label: "System Email" },
                { icon: Phone, title: "Voice Uplink", val: "+1 (XXX) XXX-XXXX", label: "Priority Line" },
                { icon: MapPin, title: "Global HQ", val: "123 Investment Blvd, FC 12345", label: "Physical Node" }
            ].map((item, i) => (
                <Card key={i} className="bg-slate-900/40 border-white/5 p-8 rounded-[2rem] hover:border-primary/30 transition-all text-center flex flex-col items-center group">
                    <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors">
                        <item.icon className="h-6 w-6 text-slate-400 group-hover:text-primary transition-colors" />
                    </div>
                    <CardHeader className="p-0 space-y-1">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500">{item.title}</CardTitle>
                        <p className="text-base font-black text-white italic">{item.val}</p>
                    </CardHeader>
                    <CardContent className="p-0 pt-4">
                        <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] opacity-60">{item.label}</p>
                    </CardContent>
                </Card>
            ))}
        </section>

        {/* Form Placeholder */}
        <section className="max-w-4xl mx-auto">
          <Card className="w-full bg-slate-900/60 border-white/10 shadow-2xl rounded-[3rem] overflow-hidden">
            <div className="grid md:grid-cols-2">
                <div className="p-10 md:p-16 space-y-8 bg-white/[0.02] border-r border-white/5">
                    <h2 className="text-3xl font-black uppercase italic text-white tracking-tighter">Authorized Inquiry</h2>
                    <p className="text-sm text-slate-400 leading-relaxed">
                        Submit your operational parameters and our team will synchronize with you within 120 minutes.
                    </p>
                    <div className="space-y-4 pt-6">
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="h-5 w-5 text-emerald-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">End-to-End Encrypted Communication</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Globe className="h-5 w-5 text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Global Operational Coverage</span>
                        </div>
                    </div>
                </div>
                <div className="p-10 md:p-16 flex flex-col justify-center items-center text-center space-y-6">
                    <div className="p-10 bg-slate-950 rounded-[2rem] border border-white/5 w-full">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Inquiry Console Initialization...</p>
                        <div className="mt-6 flex justify-center">
                            <Button className="h-14 px-10 rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest shadow-glow hover:scale-105 transition-all">
                                Open Secure Terminal
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
          </Card>
        </section>

        {/* CTA */}
        <section className="text-center py-20 border-t border-white/5">
          <h2 className="text-3xl font-black mb-8 uppercase italic text-white tracking-tighter">Ready to <span className="text-primary">Trade?</span></h2>
          <Link to="/invest">
            <Button size="lg" className="h-16 px-12 rounded-xl bg-white text-slate-950 font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all">
              Explore Market Assets
            </Button>
          </Link>
        </section>
      </div>
    </div>
  );
};

export default ContactUs;
