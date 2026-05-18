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
  Users,
  Zap,
  Star,
  Award,
  CheckCircle,
  Gem,
  Flame,
  Droplets,
  Briefcase,
  Lock,
  Coins,
  ThermometerSnowflake,
} from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-crypto.jpg";
import teamExperts from "@/assets/team-experts.jpg";
import successfulInvestor from "@/assets/successful-investor.jpg";
import happyInvestors from "@/assets/happy-investors.jpg";

const Home = () => {
  const features = [
    {
      icon: Gem,
      title: "Premium Commodities",
      description:
        "Invest in high-value assets like Gold, Lithium, and Silver sourced from verified global vendors.",
    },
    {
      icon: Shield,
      title: "Verified Vendors",
      description:
        "Every vendor undergoes a rigorous blockchain-backed verification process to ensure asset security.",
    },
    {
      icon: Briefcase,
      title: "Vendor Marketplace",
      description:
        "Apply to become a vendor, post your commodities, and attract global investors to your trade plans.",
    },
    {
      icon: Lock,
      title: "Secure Escrow",
      description:
        "Your investment funds are protected by our secure smart-contract inspired escrow system.",
    },
  ];

  const stats = [
    { number: "$12M+", label: "Asset Value" },
    { number: "25,000+", label: "Global Traders" },
    { number: "450+", label: "Verified Vendors" },
    { number: "24/7", label: "Market Support" },
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
      role: "Commodity Trader",
      image: successfulInvestor,
      rating: 5,
      comment:
        "TerrasInvestment has revolutionized how I diversify my portfolio. Investing in physical Gold and Lithium through verified vendors is a game-changer.",
    },
    {
      name: "Elena Petrov",
      role: "Certified Vendor",
      image: teamExperts,
      rating: 5,
      comment:
        "As a commodity supplier, this platform provides me with the liquidity and reach I need. The verification process is tough but worth the trust it builds.",
    },
    {
      name: "David Chen",
      role: "Portfolio Manager",
      image: happyInvestors,
      rating: 5,
      comment:
        "The transparency of the vendor plans and the security of the payment system make this my top choice for commodity-backed investments.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-primary/30">
      {/* Premium Navbar for Landing Page */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/50 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-xl shadow-lg shadow-primary/20">
              <TrendingUp className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase italic">
              TerrasInvestment
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Features</a>
            <a href="#stats" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Market Stats</a>
            <a href="#testimonials" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Success Stories</a>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Login</Link>
            <Button className="rounded-xl font-black bg-gradient-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Link to="/signup">Join Now</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Enhanced Hero Section */}
      <section
        id="home"
        className="relative min-h-screen flex items-center pt-20 overflow-hidden"
      >
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse delay-700" />
        </div>

        <div className="relative container mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="text-left space-y-10">
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-primary text-sm font-black uppercase tracking-widest animate-fade-in">
                <div className="h-2 w-2 rounded-full bg-primary animate-ping" />
                Live Commodity Marketplace
              </div>
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] animate-fade-up">
                ELITE <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-400 to-primary bg-[length:200%_auto] animate-gradient">
                  COMMODITY
                </span> <br />
                TRADING.
              </h1>
              <p className="text-xl text-slate-400 max-w-xl leading-relaxed font-medium animate-fade-up delay-100">
                The premier destination for high-stakes commodity wealth. 
                Invest in verified assets like Gold, Lithium, and Bitcoin 
                with fixed-price entry and guaranteed transparency.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 animate-fade-up delay-200">
                <Button
                  size="lg"
                  className="h-16 px-12 text-lg bg-gradient-primary text-primary-foreground shadow-2xl shadow-primary/30 hover:scale-105 transition-transform font-black rounded-2xl"
                >
                  <Link to="/signup" className="flex items-center">
                    Start Investing <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="h-16 px-12 text-lg border-2 border-white/10 hover:bg-white/5 hover:scale-105 transition-transform rounded-2xl font-black">
                  <Link to="/invest">View Market</Link>
                </Button>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 pt-6 animate-fade-up delay-300">
                {commodities.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 bg-white/5 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 hover:border-primary/50 transition-colors group">
                        <item.icon className={`h-5 w-5 ${item.color} group-hover:scale-120 transition-transform`} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">{item.name}</span>
                    </div>
                ))}
              </div>
            </div>
            
            <div className="relative group animate-fade-up delay-400 hidden lg:block">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/30 to-emerald-500/30 rounded-[3rem] blur-2xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
              <div className="relative border-2 border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <img
                  src={teamExperts}
                  alt="Commodity Experts"
                  className="w-full h-[750px] object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
                <div className="absolute bottom-10 left-10 right-10">
                  <Card className="bg-slate-900/80 backdrop-blur-2xl border-2 border-white/10 shadow-3xl transform group-hover:-translate-y-2 transition-transform duration-500">
                    <CardContent className="p-10 space-y-6">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <Badge variant="success" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 h-7 px-4 text-[10px] font-black uppercase tracking-widest">Active Trade</Badge>
                              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            </div>
                            <span className="text-emerald-400 font-black text-2xl tracking-tighter">+₦1.2M Profit</span>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-3xl font-black text-white">Elite Gold Plan</h3>
                            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Vendor: Prestige_Resources_Ltd</p>
                        </div>
                        <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                            <div className="flex -space-x-4">
                                {[1,2,3,4,5].map(i => (
                                    <div key={i} className="h-12 w-12 rounded-full border-4 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400 shadow-xl">V{i}</div>
                                ))}
                            </div>
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">4.8k+ Joined</span>
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
      <section className="py-16 bg-white/5 border-y border-white/5 overflow-hidden">
        <div className="container mx-auto px-6">
            <div className="flex flex-wrap justify-center lg:justify-between items-center gap-12 opacity-30 hover:opacity-100 transition-opacity duration-500">
                <div className="flex items-center gap-3 font-black text-3xl tracking-tighter italic"><Shield className="h-8 w-8 text-primary" /> SECURED.BY.BLOCKCHAIN</div>
                <div className="flex items-center gap-3 font-black text-3xl tracking-tighter italic"><CheckCircle className="h-8 w-8 text-primary" /> VERIFIED.VENDORS</div>
                <div className="flex items-center gap-3 font-black text-3xl tracking-tighter italic"><Gem className="h-8 w-8 text-primary" /> ASSET.BACKED</div>
                <div className="flex items-center gap-3 font-black text-3xl tracking-tighter italic"><Award className="h-8 w-8 text-primary" /> ELITE.STATUS</div>
            </div>
        </div>
      </section>

      {/* Professional Features */}
      <section id="features" className="py-40 relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mb-24">
            <div className="max-w-3xl space-y-6">
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">THE <span className="text-primary">STANDARD</span> OF EXCELLENCE.</h2>
              <p className="text-slate-400 text-xl font-medium max-w-2xl leading-relaxed">
                We provide the high-performance infrastructure required for 
                secure, large-scale commodity investments.
              </p>
            </div>
            <Button variant="link" className="text-primary font-black text-lg p-0 h-auto group">
              Explore All Features <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform" />
            </Button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="bg-slate-900/50 backdrop-blur-sm border-2 border-white/5 hover:border-primary/50 transition-all duration-500 group rounded-[2.5rem] overflow-hidden"
              >
                <CardHeader className="p-10">
                  <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-8 group-hover:bg-primary group-hover:rotate-[10deg] transition-all duration-500">
                    <feature.icon className="h-10 w-10 text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <CardTitle className="text-2xl font-black mb-4 text-white">{feature.title}</CardTitle>
                  <CardDescription className="text-lg font-medium leading-relaxed text-slate-400">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats CTA */}
      <section id="stats" className="py-32 px-6">
        <div className="container mx-auto">
          <div className="bg-gradient-to-br from-primary to-emerald-600 rounded-[4rem] p-12 md:p-24 relative overflow-hidden shadow-[0_0_100px_rgba(59,130,246,0.3)]">
            <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay"></div>
            <div className="grid lg:grid-cols-2 gap-20 items-center relative z-10">
              <div className="space-y-10">
                  <h2 className="text-5xl md:text-7xl font-black leading-[0.9] text-white tracking-tighter">JOIN THE <br /> BILLION NAIRA <br /> CLUB.</h2>
                  <p className="text-white/80 text-xl font-bold max-w-md">Whether you are an elite supplier or a strategic trader, your seat is reserved at the top.</p>
                  <div className="flex flex-col sm:flex-row gap-6">
                      <Button className="h-20 px-12 rounded-[1.5rem] bg-white text-slate-950 font-black text-xl hover:scale-105 transition-transform shadow-2xl">Start Trading</Button>
                      <Button variant="outline" className="h-20 px-12 rounded-[1.5rem] border-4 border-white/20 text-white hover:bg-white/10 font-black text-xl hover:scale-105 transition-transform">Become Vendor</Button>
                  </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                  {stats.map((stat, i) => (
                      <div key={i} className="p-10 bg-white/10 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 flex flex-col items-center text-center group hover:bg-white/20 transition-all duration-500">
                          <div className="text-5xl font-black text-white mb-3 tracking-tighter group-hover:scale-110 transition-transform">{stat.number}</div>
                          <div className="text-white/60 font-black uppercase tracking-[0.2em] text-[10px]">{stat.label}</div>
                      </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-40 bg-slate-950">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center text-center mb-24 space-y-4">
            <Badge className="bg-primary/20 text-primary border-primary/30 font-black uppercase tracking-widest px-6 py-2">Success Stories</Badge>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter">VOICES OF THE ELITE.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-slate-900/30 backdrop-blur-xl border-2 border-white/5 shadow-2xl rounded-[3rem] overflow-hidden group hover:-translate-y-4 transition-all duration-700">
                <CardContent className="p-12 space-y-10">
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(i => <Star key={i} className="h-5 w-5 fill-primary text-primary" />)}
                  </div>
                  <p className="text-2xl font-bold leading-snug italic text-slate-200">"{testimonial.comment}"</p>
                  <div className="flex items-center gap-6 pt-10 border-t border-white/5">
                    <div className="relative h-20 w-20 rounded-3xl overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-700 border-2 border-white/10">
                        <img src={testimonial.image} className="object-cover h-full w-full" />
                    </div>
                    <div>
                        <h4 className="font-black text-2xl text-white tracking-tight">{testimonial.name}</h4>
                        <p className="text-sm text-primary font-black uppercase tracking-widest">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Premium Footer */}
      <footer className="py-20 border-t border-white/5 bg-slate-950">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-xl">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <span className="text-2xl font-black tracking-tighter italic">TERRASINVESTMENT</span>
            </div>
            <div className="flex gap-10 text-sm font-black text-slate-500 uppercase tracking-widest">
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link to="/support" className="hover:text-white transition-colors">Support</Link>
            </div>
            <p className="text-slate-600 text-sm font-bold">© 2026 TERRASINVESTMENT. ELITE STATUS SECURED.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
