import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface VendorRouteProps {
  children: ReactNode;
}

const VendorRoute = ({ children }: VendorRouteProps) => {
  const { role, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  if (role !== "vendor" && role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default VendorRoute;
