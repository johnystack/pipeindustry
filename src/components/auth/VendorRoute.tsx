import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import LoadingScreen from "@/components/ui/LoadingScreen";

interface VendorRouteProps {
  children: ReactNode;
}

const VendorRoute = ({ children }: VendorRouteProps) => {
  const { role, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (role !== "vendor" && role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default VendorRoute;
