
import { useState, useEffect } from "react";
import BWTLoginForm from "@/components/BWTLoginForm";
import WaterConsumptionDashboard from "@/components/WaterConsumptionDashboard";
import BWTService from "@/services/BWTService";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if we have stored credentials
    const hasCredentials = BWTService.hasCredentials();
    setIsAuthenticated(hasCredentials);
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {isAuthenticated ? (
        <WaterConsumptionDashboard onLogout={handleLogout} />
      ) : (
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-water-700 mb-2">BWT Water Connect</h1>
            <p className="text-lg text-gray-600">
              Connectez-vous à votre adoucisseur d'eau BWT pour suivre votre consommation
            </p>
          </div>
          <BWTLoginForm onLoginSuccess={handleLoginSuccess} />
        </div>
      )}
    </div>
  );
};

export default Index;
