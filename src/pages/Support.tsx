import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  MessageCircle,
  Phone,
  Mail,
  Clock,
  HelpCircle,
  FileText,
  Shield,
  DollarSign,
  Users,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Layout from "@/components/layout/Layout";
import { useToast } from "@/hooks/use-toast";

const Support = () => {
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  const faqData = [
    {
      category: "General",
      icon: HelpCircle,
      questions: [
        {
          question: "How do I get started with PipIndustry?",
          answer:
            "To get started, simply create an account, verify your email, deposit cryptocurrency, and choose an investment plan that suits your goals. Our team will guide you through the process.",
        },
        {
          question: "What cryptocurrencies do you accept?",
          answer:
            "We accept Bitcoin (BTC), Ethereum (ETH), Tether (USDT), and TRON (TRX). All deposits are processed automatically and credited to your account upon confirmation.",
        },
        {
          question: "Is my investment safe with PipIndustry?",
          answer:
            "Yes, we use bank-level security measures including SSL encryption, cold storage for funds, and multi-signature wallets. Your investments are protected by our comprehensive security protocols.",
        },
      ],
    },
    {
      category: "Investments",
      icon: DollarSign,
      questions: [
        {
          question: "What are the minimum and maximum investment amounts?",
          answer:
            "Our Starter Plan begins at $100, Silver Plan at $1,000, Gold Plan at $5,000, and VIP Plan at $10,000. Maximum amounts vary by plan, with VIP having unlimited investment capacity.",
        },
        {
          question: "When will I see returns on my investment?",
          answer:
            "Returns are calculated daily and credited to your account. You can see your daily profits in your dashboard, and withdrawals are available according to your plan terms.",
        },
        {
          question: "Can I reinvest my profits?",
          answer:
            "Yes, you can reinvest your profits into any available plan to compound your earnings. This is a great way to maximize your investment growth over time.",
        },
      ],
    },
    {
      category: "Withdrawals",
      icon: FileText,
      questions: [
        {
          question: "How long do withdrawals take?",
          answer:
            "Withdrawals are processed within 24 hours during business days. Cryptocurrency withdrawals depend on network confirmation times, typically 1-6 confirmations.",
        },
        {
          question: "Are there withdrawal fees?",
          answer:
            "Yes, we charge network fees for cryptocurrency withdrawals. Bitcoin: 0.0005 BTC, Ethereum: 0.005 ETH, USDT: $5. These fees cover blockchain transaction costs.",
        },
        {
          question: "What's the minimum withdrawal amount?",
          answer:
            "Minimum withdrawals are: Bitcoin: 0.001 BTC, Ethereum: 0.01 ETH, USDT: $10. This ensures cost-effective processing of your withdrawal requests.",
        },
      ],
    },
    {
      category: "Referrals",
      icon: Users,
      questions: [
        {
          question: "How does the referral program work?",
          answer:
            "Share your unique referral link with friends. When they sign up and make their first investment, you earn a commission. Higher-tier plans offer better referral rates.",
        },
        {
          question: "What are the referral commission rates?",
          answer:
            "Commission rates vary by plan: Starter (5%), Silver (7%), Gold (10%), VIP (15%). Commissions are paid instantly when your referrals invest.",
        },
        {
          question: "Is there a limit to how many people I can refer?",
          answer:
            "No, there's no limit! You can refer unlimited people and earn ongoing commissions from their investments. Build your network and maximize your earnings.",
        },
      ],
    },
  ];

  const supportTickets = [
    {
      id: "TKT-001",
      subject: "Withdrawal Processing Delay",
      category: "Withdrawals",
      status: "open",
      priority: "high",
      date: "2024-01-15 10:30",
      lastReply: "Support Team",
    },
    {
      id: "TKT-002",
      subject: "Investment Plan Upgrade",
      category: "Investments",
      status: "resolved",
      priority: "medium",
      date: "2024-01-12 14:20",
      lastReply: "You",
    },
    {
      id: "TKT-003",
      subject: "Referral Commission Question",
      category: "Referrals",
      status: "pending",
      priority: "low",
      date: "2024-01-10 09:15",
      lastReply: "Support Team",
    },
  ];

  const handleSubmitTicket = () => {
    if (!subject || !category || !message) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Ticket Submitted",
      description:
        "Your support ticket has been created. We'll respond within 24 hours.",
    });

    setSubject("");
    setCategory("");
    setMessage("");
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      open: "bg-success/10 text-success border-success/20",
      pending: "bg-warning/10 text-warning border-warning/20",
      resolved: "bg-accent/10 text-accent border-accent/20",
      closed: "bg-muted/10 text-muted-foreground border-muted/20",
    };
    return variants[status as keyof typeof variants] || "bg-muted";
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      high: "bg-destructive/10 text-destructive border-destructive/20",
      medium: "bg-warning/10 text-warning border-warning/20",
      low: "bg-accent/10 text-accent border-accent/20",
    };
    return variants[priority as keyof typeof variants] || "bg-muted";
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Support Center
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Get help with your account, investments, and any questions you may
            have. Our support team is here 24/7.
          </p>
        </div>

        {/* Contact Methods */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="crypto-card text-center">
            <CardContent className="p-6">
              <MessageCircle className="h-8 w-8 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Live Chat</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get instant help from our support team
              </p>
              <Button className="crypto-button-primary">Start Chat</Button>
            </CardContent>
          </Card>

          <Card className="crypto-card text-center">
            <CardContent className="p-6">
              <Mail className="h-8 w-8 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Email Support</h3>
              <p className="text-sm text-muted-foreground mb-4">
                support@pipindustry.com
              </p>
              <Button variant="outline">Send Email</Button>
            </CardContent>
          </Card>

          <Card className="crypto-card text-center">
            <CardContent className="p-6">
              <Phone className="h-8 w-8 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Phone Support</h3>
              <p className="text-sm text-muted-foreground mb-4">
                +1 (555) 123-4567
              </p>
              <Button variant="outline">Call Now</Button>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="faq" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
            <TabsTrigger value="faq">FAQ</TabsTrigger>
            <TabsTrigger value="ticket">New Ticket</TabsTrigger>
            <TabsTrigger value="tickets">My Tickets</TabsTrigger>
          </TabsList>

          <TabsContent value="faq" className="space-y-6">
            <div className="grid gap-8">
              {faqData.map((category, index) => (
                <Card key={index} className="crypto-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <category.icon className="h-5 w-5 text-primary" />
                      {category.category}
                    </CardTitle>
                    <CardDescription>
                      Frequently asked questions about{" "}
                      {category.category.toLowerCase()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {category.questions.map((faq, faqIndex) => (
                        <AccordionItem
                          key={faqIndex}
                          value={`item-${index}-${faqIndex}`}
                        >
                          <AccordionTrigger className="text-left">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="ticket" className="space-y-6">
            <Card className="crypto-card max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>Create Support Ticket</CardTitle>
                <CardDescription>
                  Describe your issue and we'll get back to you within 24 hours
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="Brief description of your issue"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="account">Account Issues</SelectItem>
                      <SelectItem value="deposits">Deposits</SelectItem>
                      <SelectItem value="withdrawals">Withdrawals</SelectItem>
                      <SelectItem value="investments">Investments</SelectItem>
                      <SelectItem value="referrals">Referrals</SelectItem>
                      <SelectItem value="technical">
                        Technical Issues
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Please provide detailed information about your issue..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={6}
                  />
                </div>

                <Button
                  onClick={handleSubmitTicket}
                  className="w-full crypto-button-primary"
                >
                  Submit Ticket
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tickets" className="space-y-6">
            <Card className="crypto-card">
              <CardHeader>
                <CardTitle>My Support Tickets</CardTitle>
                <CardDescription>
                  Track the status of your support requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {supportTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg bg-background/50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {ticket.status === "resolved" ? (
                            <CheckCircle className="h-4 w-4 text-success" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-warning" />
                          )}
                          <div>
                            <div className="font-medium">{ticket.subject}</div>
                            <div className="text-sm text-muted-foreground">
                              {ticket.id} • {ticket.category} • {ticket.date}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Last reply: {ticket.lastReply}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={getStatusBadge(ticket.status)}
                        >
                          {ticket.status}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={getPriorityBadge(ticket.priority)}
                        >
                          {ticket.priority}
                        </Badge>
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Business Hours */}
        <Card className="crypto-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Support Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Live Chat & Email</h4>
                <p className="text-sm text-muted-foreground">
                  24/7 - Available all the time
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Phone Support</h4>
                <p className="text-sm text-muted-foreground">
                  Monday - Friday: 9:00 AM - 6:00 PM (UTC)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Support;
