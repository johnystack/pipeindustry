import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, TrendingUp, Shield, Users, Zap, Star, Award, CheckCircle, Phone, Mail, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-crypto.jpg";
import teamExperts from "@/assets/team-experts.jpg";
import successfulInvestor from "@/assets/successful-investor.jpg";
import happyInvestors from "@/assets/happy-investors.jpg";

const Home = () => {
  const features = [
    {
      icon: TrendingUp,
      title: "High Returns",
      description: "Earn up to 15% monthly returns on your crypto investments with our proven strategies."
    },
    {
      icon: Shield,
      title: "Secure Platform",
      description: "Your investments are protected with bank-level security and multi-layer encryption."
    },
    {
      icon: Users,
      title: "Referral Program",
      description: "Earn additional income by referring friends and building your investment network."
    },
    {
      icon: Zap,
      title: "Instant Withdrawals",
      description: "Access your earnings anytime with our fast and reliable withdrawal system."
    }
  ];

  const stats = [
    { number: "$2.5M+", label: "Total Invested" },
    { number: "15,000+", label: "Active Investors" },
    { number: "98.5%", label: "Success Rate" },
    { number: "24/7", label: "Support" }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Crypto Investor",
      image: successfulInvestor,
      rating: 5,
      comment: "PipIndustry has transformed my financial future. I've earned consistent 12% monthly returns for over a year!"
    },
    {
      name: "Michael Chen",
      role: "Investment Advisor",
      image: teamExperts,
      rating: 5,
      comment: "The platform's transparency and security features give me complete confidence in my investments."
    },
    {
      name: "Emma Rodriguez",
      role: "Business Owner",
      image: happyInvestors,
      rating: 5,
      comment: "Amazing referral program! I've earned $5,000+ just by sharing with friends. Highly recommended!"
    }
  ];

  const aboutFeatures = [
    {
      icon: Award,
      title: "5+ Years Experience",
      description: "Proven track record in cryptocurrency trading and investment management"
    },
    {
      icon: Shield,
      title: "Licensed & Regulated",
      description: "Fully compliant with international financial regulations and security standards"
    },
    {
      icon: Users,
      title: "Expert Team",
      description: "Professional traders and analysts with decades of combined experience"
    },
    {
      icon: TrendingUp,
      title: "Consistent Growth",
      description: "Delivering stable returns through bull and bear markets since 2019"
    }
  ];

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen">
      {/* Enhanced Hero Section with Navigation */}
      <section id="home" className="relative overflow-hidden bg-gradient-hero min-h-screen flex items-center">
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="Crypto Investment Platform" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/40 to-transparent"></div>
        </div>
        

        <div className="relative container mx-auto px-4 py-24 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-left">
              <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-6 animate-fade-in">
                <span className="text-foreground">Invest in</span>{" "}
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  Crypto
                </span>{" "}
                <span className="text-foreground block">with Confidence</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl leading-relaxed">
                Join thousands of investors earning consistent returns through our 
                professional crypto investment platform. Start with as little as $100 
                and watch your wealth grow with our proven strategies.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button size="lg" className="bg-gradient-primary text-primary-foreground shadow-glow hover-scale">
                  <Link to="/signup" className="flex items-center">
                    Start Investing <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="hover-scale">
                  <Link to="/invest">View Investment Plans</Link>
                </Button>
                <Button variant="ghost" size="lg" className="hover-scale">
                  <Link to="/login">Login to Dashboard</Link>
                </Button>
              </div>
              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mr-2" />
                  SEC Compliant
                </div>
                <div className="flex items-center">
                  <Shield className="h-4 w-4 text-blue-500 mr-2" />
                  Bank-Level Security
                </div>
                <div className="flex items-center">
                  <Award className="h-4 w-4 text-yellow-500 mr-2" />
                  5+ Years Trusted
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="relative">
                <img 
                  src={teamExperts} 
                  alt="Professional Investment Team" 
                  className="rounded-2xl shadow-elegant w-full h-[400px] md:h-[600px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent rounded-2xl"></div>
                <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6">
                  <div className="bg-card/90 backdrop-blur-md rounded-xl p-4 md:p-6 border border-border">
                    <div className="flex items-center justify-between mb-2 md:mb-4">
                      <span className="text-primary font-semibold text-sm md:text-base">Live Performance</span>
                      <span className="text-emerald-500 font-bold text-sm md:text-base">+12.4%</span>
                    </div>
                    <div className="text-xl md:text-2xl font-bold text-foreground mb-1 md:mb-2">$2,847,392</div>
                    <div className="text-xs md:text-sm text-muted-foreground">Total Portfolio Value</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">{stat.number}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Choose PipIndustry?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Our platform combines cutting-edge technology with proven investment 
              strategies to deliver consistent returns for our clients.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-gradient-card border-border shadow-card hover-scale group">
                <CardHeader>
                  <feature.icon className="h-10 w-10 text-primary mb-4 group-hover:scale-110 transition-transform" />
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">About PipIndustry</h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Founded in 2019, PipIndustry has rapidly grown to become a leading and trusted cryptocurrency investment platform, 
                serving a global community of over 15,000 active investors. Our mission is to democratize access to the lucrative world of crypto investments, 
                providing a secure, transparent, and highly profitable environment for wealth creation. Our dedicated team comprises seasoned traders, 
                financial analysts, and blockchain experts who leverage cutting-edge technology and proprietary algorithms to identify optimal investment opportunities 
                and deliver consistent, superior returns for our clients, even in volatile market conditions.
              </p>
              <div className="grid sm:grid-cols-2 gap-6 mb-8">
                {aboutFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button className="bg-gradient-primary text-primary-foreground shadow-glow">
                <Link to="/signup">Start Your Journey</Link>
              </Button>
            </div>
            <div className="relative">
              <img 
                src={happyInvestors} 
                alt="Happy Investors" 
                className="rounded-2xl shadow-elegant w-full"
              />
              <div className="absolute -bottom-6 -left-6 bg-card border border-border rounded-xl p-6 shadow-elegant">
                <div className="text-3xl font-bold text-primary mb-2">98.5%</div>
                <div className="text-sm text-muted-foreground">Customer Satisfaction</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">What Our Investors Say</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Real stories from real investors who have transformed their financial future with PipIndustry.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-gradient-card border-border shadow-card hover-scale">
                <CardHeader>
                  <div className="flex items-center space-x-4 mb-4">
                    <img 
                      src={testimonial.image} 
                      alt={testimonial.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
                    />
                    <div>
                      <h3 className="font-semibold">{testimonial.name}</h3>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                  <div className="flex space-x-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed italic">
                    "{testimonial.comment}"
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Get in Touch</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Whether you're new to crypto investing or a seasoned pro, our dedicated support team is here to assist you every step of the way. 
              Reach out to us with any questions, feedback, or inquiries, and we'll ensure you receive prompt and comprehensive assistance. 
              Your financial success is our priority.
            </p>
          </div>
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Phone className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Call Us</h3>
              <p className="text-muted-foreground mb-4">Speak with our investment specialists</p>
              <p className="font-semibold text-primary">+1 (555) 123-4567</p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Email Us</h3>
              <p className="text-muted-foreground mb-4">Get support within 24 hours</p>
              <p className="font-semibold text-primary">support@pipindustry.com</p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Visit Us</h3>
              <p className="text-muted-foreground mb-4">Meet our team in person</p>
              <p className="font-semibold text-primary">New York, NY 10001</p>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-24 bg-gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img 
            src={successfulInvestor} 
            alt="Success" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-primary-foreground mb-6">
            Ready to Start Your Investment Journey?
          </h2>
          <p className="text-primary-foreground/90 mb-8 max-w-3xl mx-auto text-lg leading-relaxed">
            Join our community of successful investors and start earning passive income 
            from cryptocurrency investments today. Get started with just $100 and watch your wealth grow.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button size="lg" variant="secondary" className="shadow-glow hover-scale">
              <Link to="/signup" className="flex items-center">
                Get Started Now <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
              <Link to="/login">View Live Demo</Link>
            </Button>
          </div>
          <div className="grid sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-foreground mb-2">$100</div>
              <div className="text-primary-foreground/80">Minimum Investment</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-foreground mb-2">24/7</div>
              <div className="text-primary-foreground/80">Customer Support</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-foreground mb-2">5 Min</div>
              <div className="text-primary-foreground/80">Account Setup</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;