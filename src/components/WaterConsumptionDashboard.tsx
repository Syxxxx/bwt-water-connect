
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import BWTService, { WaterConsumptionData } from "@/services/BWTService";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, TooltipProps } from "recharts";
import { Loader2, RefreshCw, LogOut, AlertTriangle, CheckCircle, Droplet } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

interface WaterConsumptionDashboardProps {
  onLogout: () => void;
}

const WaterConsumptionDashboard = ({ onLogout }: WaterConsumptionDashboardProps) => {
  const [consumptionData, setConsumptionData] = useState<WaterConsumptionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await BWTService.fetchWaterConsumptionData();
      setConsumptionData(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les données de consommation.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = () => {
    BWTService.removeCredentials();
    onLogout();
    toast({
      title: "Déconnexion",
      description: "Vous avez été déconnecté de votre compte BWT.",
    });
  };

  const formatTooltipDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "dd MMMM yyyy", { locale: fr });
    } catch (e) {
      return dateStr;
    }
  };

  const totalConsumption = consumptionData.reduce((sum, item) => sum + item.consumption, 0);
  const averageConsumption = consumptionData.length 
    ? Math.round(totalConsumption / consumptionData.length) 
    : 0;
  
  const regenCount = consumptionData.reduce((sum, item) => sum + item.regenCount, 0);
  const hasPowerOutage = consumptionData.some(item => item.powerOutage);
  const hasSaltAlarm = consumptionData.some(item => item.saltAlarm);

  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as WaterConsumptionData;
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-bold text-gray-800">{formatTooltipDate(data.date)}</p>
          <p className="text-water-700">
            <span className="font-medium">Consommation: </span> 
            {data.consumption} litres
          </p>
          {data.regenCount > 0 && (
            <p className="text-blue-600">
              <span className="font-medium">Régénérations: </span> 
              {data.regenCount}
            </p>
          )}
          {data.powerOutage && (
            <p className="text-amber-600">
              <span className="font-medium">Coupure de courant</span>
            </p>
          )}
          {data.saltAlarm && (
            <p className="text-red-600">
              <span className="font-medium">Alarme sel</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-water-700 flex items-center">
            <Droplet className="mr-2 h-6 w-6" />
            BWT Water Connect
          </h1>
          <p className="text-muted-foreground">
            {lastUpdate && (
              <>Dernière mise à jour: {format(lastUpdate, "dd MMMM yyyy à HH:mm", { locale: fr })}</>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={fetchData} 
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Actualiser
          </Button>
          <Button 
            variant="ghost" 
            onClick={handleLogout}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-water-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-water-700 text-lg">Consommation moyenne</CardTitle>
            <CardDescription>Par jour sur la période</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-water-700">{averageConsumption} L</div>
          </CardContent>
        </Card>
        
        <Card className="bg-water-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-water-700 text-lg">Consommation totale</CardTitle>
            <CardDescription>Sur la période</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-water-700">{totalConsumption} L</div>
          </CardContent>
        </Card>
        
        <Card className="bg-water-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-water-700 text-lg">Nombre de régénérations</CardTitle>
            <CardDescription>Sur la période</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-water-700">{regenCount}</div>
          </CardContent>
        </Card>
      </div>

      {(hasPowerOutage || hasSaltAlarm) && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-md">
          <div className="flex items-center gap-2 text-amber-700 mb-2">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="font-medium">Alertes détectées</h3>
          </div>
          <ul className="space-y-1 pl-7 text-sm">
            {hasPowerOutage && (
              <li className="text-amber-600">Coupure de courant détectée</li>
            )}
            {hasSaltAlarm && (
              <li className="text-red-600">Alarme sel active - vérifiez le niveau de sel</li>
            )}
          </ul>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Consommation d'eau quotidienne</CardTitle>
          <CardDescription>
            Visualisation de votre consommation d'eau en litres par jour
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-water-500" />
            </div>
          ) : consumptionData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[...consumptionData].reverse()}
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => {
                      try {
                        return format(parseISO(value), "dd/MM");
                      } catch (e) {
                        return value;
                      }
                    }}
                  />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="consumption" 
                    fill="#0288d1" 
                    name="Consommation (L)" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-10">
              Aucune donnée de consommation disponible
            </div>
          )}
        </CardContent>
      </Card>

      <div className="bg-white border rounded-lg p-4 text-sm">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <h3 className="font-medium">À propos de Home Assistant</h3>
        </div>
        <p className="text-muted-foreground pl-7">
          Cette interface est conçue pour s'intégrer à Home Assistant. Utilisez les informations de connexion
          de votre compte BWT pour récupérer automatiquement les données de consommation d'eau.
        </p>
      </div>
    </div>
  );
};

export default WaterConsumptionDashboard;
