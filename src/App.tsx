import { useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { AuthProvider, ProtectedRoute } from "./components/auth/AuthProvider";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AboutUs from "./pages/AboutUs";
import ContactUs from "./pages/ContactUs";
import Dashboard from "./pages/Dashboard";
import Invest from "./pages/Invest";
import InvestNow from "./pages/InvestNow";
import Withdraw from "./pages/Withdraw";
import Transactions from "./pages/Transactions";
import Referrals from "./pages/Referrals";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import AdminRoute from "./components/auth/AdminRoute";
import UserInvestmentDetails from "./pages/UserInvestmentDetails";

import ManageInvestment from "./pages/ManageInvestment";
import NotFound from "./pages/NotFound";
import ResendEmail from "./pages/ResendEmail";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthHandler />
          <AuthProvider>
            <Routes>
              {/* Public Routes */}
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/invest" element={<Invest />} />
                <Route path="/login" element={<Login />} />
              </Route>
              <Route path="/signup" element={<Signup />} />
              <Route path="/ref/:username" element={<Signup />} />
              <Route path="/resend-email" element={<ResendEmail />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/contact" element={<ContactUs />} />

              {/* Protected Routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />

                <Route
                  path="/manage-investment/:id"
                  element={<ManageInvestment />}
                />

                <Route path="/invest-now" element={<InvestNow />} />
                <Route path="/withdraw" element={<Withdraw />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/referrals" element={<Referrals />} />
                <Route path="/settings" element={<Settings />} />
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <Admin />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/users/:userId/investments"
                  element={
                    <AdminRoute>
                      <UserInvestmentDetails />
                    </AdminRoute>
                  }
                />
              </Route>

              {/* Catch-all Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

const AuthHandler = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('type=signup')) {
      // Clear the hash to prevent the logic from re-running on refresh
      window.history.replaceState(null, '', ' ');

      toast({
        className: "bg-green-600 border-0 text-white font-bold",
        title: "✅ Email Verified!",
        description: "You have successfully verified your email. Redirecting to login...",
      });

      setTimeout(() => {
        navigate('/login');
      }, 3000);
    }
  }, [navigate, toast]);

  return null; // This component does not render anything
};

export default App;
