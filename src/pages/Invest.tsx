import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Crown, Diamond } from "lucide-react";

import investmentPlansImage from "@/assets/investment-plans.jpg";

const plans = [
    {
      name: "Starter Plan",
      icon: Star,
      popular: false,
      minInvestment: "$100",
      maxInvestment: "$999",
      duration: "7 days",
      dailyReturn: "4%",
      sevenDayReturn: "28%",
      totalReturn: "128%",
      profitPercentage: "28%",
      features: [
        "Daily profit withdrawal",
        "24/7 customer support",
        "Secure investment",
        "Instant deposits",
      ],
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      name: "Silver Plan",
      icon: Crown,
      popular: true, // Keep this for "Most Popular" label
      minInvestment: "$1,000",
      maxInvestment: "$4,999",
      duration: "7 days",
      dailyReturn: "6%",
      sevenDayReturn: "42%",
      totalReturn: "142%",
      profitPercentage: "42%",
      features: [
        "Higher daily returns",
        "Priority customer support",
        "Advanced analytics",
        "Instant deposits",
        "Referral bonuses",
      ],
      color: "text-gray-400",
      bgColor: "bg-gray-400/10",
    },
    {
      name: "Gold Plan",
      icon: Crown,
      popular: false,
      minInvestment: "$5,000",
      maxInvestment: "$9,999",
      duration: "7 days",
      dailyReturn: "8%",
      sevenDayReturn: "56%",
      totalReturn: "156%",
      profitPercentage: "56%",
      features: [
        "Premium daily returns",
        "Dedicated account manager",
        "Advanced portfolio tools",
        "Instant deposits",
        "Enhanced referral bonuses",
        "Market insights",
      ],
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      name: "VIP Plan",
      icon: Diamond,
      popular: false,
      minInvestment: "$10,000",
      maxInvestment: "Unlimited",
      duration: "7 days",
      dailyReturn: "10%",
      sevenDayReturn: "70%",
      totalReturn: "170%",
      profitPercentage: "70%",
      features: [
        "Maximum daily returns",
        "Personal investment advisor",
        "Exclusive market access",
        "Instant deposits",
        "VIP referral program",
        "Private telegram group",
        "Monthly strategy calls",
      ],
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ];

const Invest = () => {
  const [selectedPlan, setSelectedPlan] = useState<number | null>(1); // Silver plan selected by default
  const [investmentAmount, setInvestmentAmount] = useState<number>(0);
  const [selectedCalculatorPlan, setSelectedCalculatorPlan] =
    useState<string>("");
  const navigate = useNavigate();

  const handleSelectPlan = () => {
    navigate("/signup");
  };

  // Initialize selectedCalculatorPlan on mount
  useEffect(() => {
    if (plans.length > 0) {
      setSelectedCalculatorPlan(plans[0].name);
    }
  }, []);

  const calculateReturns = (amount: number, planName: string) => {
    const plan = plans.find((p) => p.name === planName);
    if (!plan || amount <= 0) {
      return { expectedProfit: 0, totalReturn: 0 };
    }

    const dailyRate = parseFloat(plan.dailyReturn) / 100;
    const durationDays = 7; // All plans are 7 days now

    const profit = amount * dailyRate * durationDays;
    const total = amount + profit;

    return { expectedProfit: profit, totalReturn: total };
  };

  const { expectedProfit, totalReturn } = calculateReturns(
    investmentAmount,
    selectedCalculatorPlan,
  );

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Choose Your Investment Plan</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Select the investment plan that best fits your financial goals and
          risk appetite. All plans offer guaranteed returns and secure
          investment management.
        </p>
        <div className="relative max-w-md mx-auto">
          <img
            src={investmentPlansImage}
            alt="Investment Plans"
            className="w-full h-40 object-cover rounded-lg opacity-80"
          />
        </div>
      </div>

      {/* Investment Plans */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {plans.map((plan, index) => (
          <Card
            key={index}
            className={`relative bg-gradient-card border-border shadow-card transition-all duration-300 hover:shadow-glow cursor-pointer ${
              selectedPlan === index ? "ring-2 ring-primary" : ""
            }`}
            onMouseEnter={() => setSelectedPlan(index)}
            onMouseLeave={() => setSelectedPlan(1)}
          >
            {plan.popular && (
              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gradient-primary text-primary-foreground">
                Most Popular
              </Badge>
            )}

            <CardHeader className="text-center p-4 md:p-6">
              <div className={`mx-auto p-3 rounded-full ${plan.bgColor} w-fit`}>
                <plan.icon className={`h-6 w-6 ${plan.color}`} />
              </div>
              <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
              <CardDescription className="text-sm">
                {plan.minInvestment} - {plan.maxInvestment}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 p-4 md:p-6">
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-primary">
                  {plan.profitPercentage}
                </div>
                <div className="text-sm text-muted-foreground">
                  7-Day Return
                </div>
                <div className="text-xs text-muted-foreground">
                  {plan.dailyReturn} daily • {plan.duration} duration
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Plan Features:</h4>
                <ul className="space-y-2">
                  {plan.features.map((feature, featureIndex) => (
                    <li
                      key={featureIndex}
                      className="flex items-center text-sm"
                    >
                      <Check className="h-4 w-4 text-success mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t">
                <Button
                  size="lg"
                  className="w-full bg-gradient-primary text-primary-foreground shadow-glow"
                  onClick={() => handleSelectPlan(plan)}
                >
                  Select Plan
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Investment Calculator */}
      <Card className="bg-gradient-card border-border shadow-card">
        <CardHeader>
          <CardTitle>Investment Calculator</CardTitle>
          <CardDescription>
            Calculate your potential earnings with our investment plans
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Investment Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <input
                  type="number"
                  placeholder="5,000"
                  className="w-full pl-8 pr-3 py-2 bg-background border border-border rounded-md text-sm"
                  value={investmentAmount === 0 ? "" : investmentAmount}
                  onChange={(e) => setInvestmentAmount(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Investment Plan</label>
              <select
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm"
                value={selectedCalculatorPlan}
                onChange={(e) => setSelectedCalculatorPlan(e.target.value)}
              >
                <option>Select a plan</option>
                {plans.map((plan) => (
                  <option key={plan.name} value={plan.name}>
                    {plan.name} - {plan.profitPercentage}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Duration</label>
              <select className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm">
                <option>30 days</option>
                <option>60 days</option>
                <option>90 days</option>
                <option>180 days</option>
              </select>
            </div>
          </div>
          <div className="mt-6 p-4 bg-background/50 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xs md:text-sm text-muted-foreground">
                  Total Investment
                </div>
                <div className="text-lg font-bold">
                  ${investmentAmount.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs md:text-sm text-muted-foreground">
                  Expected Profit
                </div>
                <div className="text-lg font-bold text-success">
                  $
                  {expectedProfit.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
              <div>
                <div className="text-xs md:text-sm text-muted-foreground">
                  Total Return
                </div>
                <div className="text-lg font-bold text-primary">
                  $
                  {totalReturn.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Invest;
