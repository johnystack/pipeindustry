import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Link } from "react-router-dom";
import Header from "../components/layout/Header"; // Directly import Header

const AboutUs: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header /> {/* Render Header directly */}
      <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <h1 className="text-5xl font-extrabold tracking-tight mb-6 leading-tight">
            Invest with Confidence, Grow with{" "}
            <span className="text-primary">PipIndustry</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Your trusted partner in navigating the financial markets, offering
            secure and high-yield investment opportunities.
          </p>
          <Link to="/signup">
            <Button size="lg" className="text-lg px-8 py-3">
              Start Investing Today
            </Button>
          </Link>
        </section>

        {/* Our Mission Section */}
        <section className="mb-16">
          <Card className="w-full max-w-5xl mx-auto shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-4xl font-bold mb-4">
                Our Mission
              </CardTitle>
              <CardDescription className="text-lg">
                Empowering your financial future through transparency, security,
                and innovation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 text-lg leading-relaxed">
              <p>
                At PipIndustry, our mission is to democratize access to robust
                investment portfolios, ensuring every individual and business
                has the opportunity to achieve their financial aspirations. We
                are committed to providing a platform where transparency,
                security, and exceptional returns are not just promises, but
                guaranteed realities.
              </p>
              <p>
                We leverage cutting-edge technology and a team of seasoned
                financial experts to identify and capitalize on emerging market
                trends. Our meticulous approach ensures that your investments
                are strategically managed for consistent growth and long-term
                stability.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Why Choose Us Section */}
        <section className="mb-16">
          <h2 className="text-4xl font-bold text-center mb-12">
            Why Choose PipIndustry?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="text-center p-6 shadow-md">
              <CardHeader>
                <CardTitle className="text-2xl font-semibold mb-2">
                  Trusted Expertise
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Benefit from the insights of our expert financial analysts and
                  market strategists who guide your investments.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center p-6 shadow-md">
              <CardHeader>
                <CardTitle className="text-2xl font-semibold mb-2">
                  Guaranteed Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Your assets are protected with state-of-the-art encryption and
                  robust security protocols.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center p-6 shadow-md">
              <CardHeader>
                <CardTitle className="text-2xl font-semibold mb-2">
                  Transparent Growth
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Gain clear insights into your portfolio's performance with
                  detailed reports and accessible support.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center bg-primary-foreground py-12 rounded-lg shadow-xl">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Grow Your Wealth?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Join thousands of satisfied investors who are building their
            financial future with PipIndustry.
          </p>
          <Link to="/signup">
            <Button size="lg" className="text-lg px-10 py-4">
              Get Started Now
            </Button>
          </Link>
        </section>
      </div>
    </div>
  );
};

export default AboutUs;
