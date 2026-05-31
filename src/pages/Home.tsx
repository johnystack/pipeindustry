import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowRight,
  TrendingUp,
  Shield,
  Zap,
  Star,
  Award,
  CheckCircle,
  Gem,
  Droplets,
  Briefcase,
  Lock,
  Coins,
  ThermometerSnowflake,
} from "lucide-react";
import { Link } from "react-router-dom";
import teamExperts from "@/assets/team-experts.jpg";
import successfulInvestor from "@/assets/successful-investor.jpg";
import happyInvestors from "@/assets/happy-investors.jpg";

const Home = () => {
  const features = [
    {
      icon: Gem,
      title: "Premium Commodities",
      description: "Invest in high-value assets like Gold, Lithium, and Silver from verified vendors.",
    },
    {
      icon: Shield,
      title: "Verified Vendors",
      description: "Rigorous blockchain-backed verification ensuring maximum asset security.",
    },
    {
      icon: Briefcase,
      title: "Marketplace",
      description: "Apply as a vendor and attract global investors to your premium trade plans.",
    },
    {
      icon: Lock,
      title: "Secure Escrow",
      description: "Protected funds through our proprietary smart-contract inspired system.",
    },
  ];

  const stats = [
    { number: "$12M+", label: "Asset Value" },
    { number: "25k+", label: "Global Traders" },
    { number: "450+", label: "Verified Vendors" },
    { number: "24/7", label: "Live Support" },
  ];

  const commodities = [
    { name: "Gold", icon: Gem, color: "text-yellow-500" },
    { name: "Lithium", icon: Zap, color: "text-purple-500" },
    { name: "Crude Oil", icon: Droplets, color: "text-blue-600" },
    { name: "Bitcoin", icon: Coins, color: "text-orange-500" },
    { name: "Natural Gas", icon: ThermometerSnowflake, color: "text-blue-300" },
  ];

  const testimonials = [
    {
      name: "Marcus Thorne",
      role: "Traders Hub",
      image: successfulInvestor,
      comment: "TerrasInvestment has revolutionized how I diversify my portfolio with physical assets.",
    },
    {
      name: "Elena Petrov",
      role: "Verified Vendor",
      image: teamExperts,
      comment: "This platform provides the liquidity and global reach my commodity trade needs.",
    },
    {
      name: "David Chen",
      role: "Portfolio Lead",
      image: happyInvestors,
      comment: "Transparency and security make this my top choice for commodity investments.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-primary/30">
      {/* Hero Section */}
      <section id="home" className="relative min-h-[70vh] md:min-h-[85vh] flex items-center pt-20 md:pt-32 pb-12 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/5 rounded-full blur-[100px] animate-pulse delay-700" />
        </div>

        <div className="relative container mx-auto px-4 md:px-6">
          <div className="grid lg:grid-cols-2 gap-10 md:gap-16 items-center">
            <div className="space-y-6 md:space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-primary text-[10px] md:text-xs font-black uppercase tracking-widest">
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
                Global Market Live
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[1.05] md:leading-[0.95] uppercase italic">
                ELITE <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-400 to-primary">COMMODITY</span> <br />
                TRADING.
              </h1>
              <p className="text-sm md:text-lg text-slate-400 max-w-lg leading-relaxed font-medium mx-auto lg:mx-0">
                The premier destination for high-stakes commodity wealth. 
                Invest in verified assets with fixed-price entry and guaranteed transparency.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/signup">
                  <Button className="h-12 md:h-14 px-10 w-full sm:w-auto rounded-xl bg-primary text-primary-foreground font-black text-xs md:text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
                    Start Trading <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/invest">
                  <Button variant="outline" className="h-12 md:h-14 px-10 w-full sm:w-auto rounded-xl border-white/10 text-white font-black text-xs md:text-sm uppercase tracking-widest hover:bg-white/5">
                    View Market
                  </Button>
                </Link>
              </div>
              
              <div className="flex flex-wrap justify-center lg:justify-start items-center gap-3 pt-4">
                {commodities.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/5 hover:border-primary/40 transition-colors group">
                        <item.icon className={`h-3.5 w-3.5 md:h-4 md:w-4 ${item.color}`} />
                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-400">{item.name}</span>
                    </div>
                ))}
              </div>
            </div>
            
            <div className="relative group hidden lg:block">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-emerald-500/20 rounded-[2.5rem] blur-2xl opacity-30"></div>
              <div className="relative border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <img src={teamExperts} alt="Experts" className="w-full h-[550px] object-cover grayscale-[0.2]" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-8 left-8 right-8">
                  <Card className="bg-slate-900/80 backdrop-blur-2xl border border-white/10 shadow-2xl">
                    <CardContent className="p-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/20 px-3 py-0.5 text-[9px] font-black uppercase tracking-widest">Active Trade</Badge>
                            <span className="text-emerald-400 font-black text-xl tracking-tighter">+₦1,250,400</span>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-black text-white italic uppercase tracking-tight">Industrial Lithium</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Secured by Global Ventures</p>
                        </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Ticker */}
      <section className="py-8 bg-white/[0.02] border-y border-white/5">
        <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center lg:justify-between items-center gap-8 opacity-40">
                <div className="flex items-center gap-2 font-black text-[10px] md:text-xs tracking-[0.2em] uppercase italic"><Shield className="h-4 w-4 text-primary" /> Blockchain Secured</div>
                <div className="flex items-center gap-2 font-black text-[10px] md:text-xs tracking-[0.2em] uppercase italic"><CheckCircle className="h-4 w-4 text-primary" /> Verified Assets</div>
                <div className="flex items-center gap-2 font-black text-[10px] md:text-xs tracking-[0.2em] uppercase italic"><Gem className="h-4 w-4 text-primary" /> Commodity Backed</div>
                <div className="flex items-center gap-2 font-black text-[10px] md:text-xs tracking-[0.2em] uppercase italic"><Award className="h-4 w-4 text-primary" /> Tier-1 Status</div>
            </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 md:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center lg:text-left mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic">THE <span className="text-primary">STANDARD</span> OF EXCELLENCE.</h2>
            <p className="text-slate-400 text-sm md:text-base font-medium max-w-xl leading-relaxed mx-auto lg:mx-0">
              Elite infrastructure designed for institutional-grade asset security and seamless trade execution.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="bg-slate-900/40 border border-white/5 hover:border-primary/30 transition-all duration-500 rounded-2xl overflow-hidden">
                <CardHeader className="p-8">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-base font-black mb-2 text-white uppercase italic">{feature.title}</CardTitle>
                  <CardDescription className="text-xs md:text-sm font-medium leading-relaxed text-slate-400">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats CTA */}
      <section className="py-12 md:py-20 px-4 md:px-6">
        <div className="container mx-auto">
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10 rounded-[2.5rem] p-10 md:p-20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>
            <div className="grid lg:grid-cols-2 gap-12 items-center relative z-10">
              <div className="space-y-8 text-center lg:text-left">
                  <h2 className="text-4xl md:text-5xl font-black leading-tight text-white tracking-tighter uppercase italic">JOIN THE <br /> <span className="text-primary">PREMIUM</span> <br /> TRADING CIRCLE.</h2>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                    <Link to="/signup">
                      <Button className="h-12 px-10 rounded-xl bg-primary text-primary-foreground font-black text-xs md:text-sm uppercase tracking-widest shadow-lg">Get Started</Button>
                    </Link>
                    <Link to="/contact">
                      <Button variant="outline" className="h-12 px-10 rounded-xl border-white/20 text-white font-black text-xs md:text-sm uppercase tracking-widest">Inquire Now</Button>
                    </Link>
                  </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  {stats.map((stat, i) => (
                      <div key={i} className="p-8 bg-white/[0.02] rounded-2xl border border-white/5 text-center">
                          <div className="text-3xl md:text-4xl font-black text-white mb-2 italic">{stat.number}</div>
                          <div className="text-slate-500 font-black uppercase tracking-widest text-[9px] md:text-[10px]">{stat.label}</div>
                      </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 md:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16 space-y-4">
            <Badge className="bg-primary/10 text-primary border-primary/20 font-black uppercase tracking-[0.2em] px-4 py-1 text-[10px]">Success Stories</Badge>
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic">VOICES OF THE ELITE.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, index) => (
              <Card key={index} className="bg-slate-900/20 backdrop-blur-xl border border-white/5 rounded-[2rem] hover:bg-slate-900/40 transition-all duration-700">
                <CardContent className="p-10 space-y-6">
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(i => <Star key={i} className="h-3.5 w-3.5 fill-primary text-primary" />)}
                  </div>
                  <p className="text-base md:text-lg font-bold italic text-slate-300">"{t.comment}"</p>
                  <div className="flex items-center gap-4 pt-6 border-t border-white/5">
                    <img src={t.image} className="h-12 w-12 rounded-xl object-cover grayscale border border-white/10" />
                    <div>
                        <h4 className="font-black text-sm md:text-base text-white tracking-tight uppercase italic">{t.name}</h4>
                        <p className="text-[9px] md:text-[10px] text-primary font-black uppercase tracking-widest">{t.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-white/5 bg-slate-950">
        <div className="container mx-auto px-4 text-center space-y-10">
          <div className="flex items-center justify-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xl font-black tracking-tighter uppercase italic">TERRASINVESTMENT</span>
          </div>
          <div className="flex flex-wrap justify-center gap-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link to="/support" className="hover:text-white transition-colors">Support</Link>
            <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>
          <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">© 2026 TERRASINVESTMENT. ELITE STATUS SECURED.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
