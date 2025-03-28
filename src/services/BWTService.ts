
import { toast } from "@/components/ui/use-toast";

export interface BWTCredentials {
  username: string;
  password: string;
}

export interface BWTDeviceData {
  connectable: boolean;
  connected: boolean;
  online: boolean;
  lastSeenDateTime: string;
  deviceDataHistory: BWTDeviceHistory;
  dataCategories: any[];
}

export interface BWTDeviceHistory {
  refreshDate: string;
  codes: string[];
  descriptions: string[];
  types: string[];
  lines: Array<[string, number, boolean, number, boolean]>;
}

export interface WaterConsumptionData {
  date: string;
  consumption: number;
  regenCount: number;
  powerOutage: boolean;
  saltAlarm: boolean;
}

class BWTService {
  private credentials: BWTCredentials | null = null;
  private isAuthenticated = false;

  constructor() {
    // Check if credentials are stored in localStorage
    const storedCredentials = localStorage.getItem('bwt-credentials');
    if (storedCredentials) {
      this.credentials = JSON.parse(storedCredentials);
      this.isAuthenticated = true;
    }
  }

  setCredentials(credentials: BWTCredentials) {
    this.credentials = credentials;
    localStorage.setItem('bwt-credentials', JSON.stringify(credentials));
    this.isAuthenticated = true;
  }

  removeCredentials() {
    this.credentials = null;
    localStorage.removeItem('bwt-credentials');
    this.isAuthenticated = false;
  }

  hasCredentials(): boolean {
    return this.isAuthenticated && this.credentials !== null;
  }

  getCredentials(): BWTCredentials | null {
    return this.credentials;
  }

  async login(credentials: BWTCredentials): Promise<boolean> {
    try {
      // In a real app, we would authenticate against the BWT API
      // Since we can't actually do that here, we'll simulate a login
      // and store the credentials for future requests
      
      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.setCredentials(credentials);
      return true;
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Erreur de connexion",
        description: "Impossible de se connecter à BWT. Vérifiez vos identifiants.",
        variant: "destructive",
      });
      return false;
    }
  }

  async fetchWaterConsumptionData(): Promise<WaterConsumptionData[]> {
    if (!this.hasCredentials()) {
      throw new Error("Not authenticated");
    }

    try {
      // In a real app, we would use the stored credentials to make an authenticated
      // request to the BWT API. Since we can't do that here, we'll return mock data
      // based on the example JSON provided.
      
      // Mock data similar to what we'd get from the API
      const mockData = {
        dataset: {
          connectable: true,
          connected: true,
          online: false,
          lastSeenDateTime: "2025-03-28T09:42:36.8427826Z",
          deviceDataHistory: {
            refreshDate: "2025-03-12T09:48:07.000",
            codes: [
              "date",
              "regenCount",
              "powerOutage",
              "waterUse",
              "saltAlarm"
            ],
            descriptions: [
              "Date relevé",
              "Nombre de régénérations",
              "Coupure de courant",
              "Consommation d'eau (l)",
              "Alarme sel"
            ],
            types: [
              "date",
              "int",
              "bool",
              "int",
              "bool"
            ],
            lines: [
              ["2025-03-11", 0, false, 200, false],
              ["2025-03-10", 0, false, 170, false],
              ["2025-03-09", 0, false, 140, false],
              ["2025-03-08", 0, false, 140, false],
              ["2025-03-07", 0, false, 400, false],
              ["2025-03-06", 0, false, 270, false],
              ["2025-03-05", 0, false, 170, false],
              ["2025-03-04", 1, false, 200, false],
              ["2025-03-03", 0, false, 210, false],
              ["2025-03-02", 0, false, 200, false],
              ["2025-03-01", 0, false, 230, false],
              ["2025-02-28", 0, false, 440, false],
              ["2025-02-27", 0, false, 280, false],
              ["2025-02-26", 0, false, 340, false],
              ["2025-02-25", 1, true, 160, false]
            ]
          },
          dataCategories: []
        }
      };

      // Process the data
      return this.processDeviceData(mockData.dataset);
    } catch (error) {
      console.error("Error fetching water consumption data:", error);
      toast({
        title: "Erreur de récupération des données",
        description: "Impossible de récupérer les données de consommation d'eau.",
        variant: "destructive",
      });
      throw error;
    }
  }

  private processDeviceData(data: BWTDeviceData): WaterConsumptionData[] {
    const waterIndex = data.deviceDataHistory.codes.indexOf('waterUse');
    const regenCountIndex = data.deviceDataHistory.codes.indexOf('regenCount');
    const powerOutageIndex = data.deviceDataHistory.codes.indexOf('powerOutage');
    const saltAlarmIndex = data.deviceDataHistory.codes.indexOf('saltAlarm');
    
    return data.deviceDataHistory.lines.map(line => ({
      date: line[0], // Date is always at index 0
      consumption: line[waterIndex] as number,
      regenCount: line[regenCountIndex] as number,
      powerOutage: line[powerOutageIndex] as boolean,
      saltAlarm: line[saltAlarmIndex] as boolean
    }));
  }
}

export default new BWTService();
