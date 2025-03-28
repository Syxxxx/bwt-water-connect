
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
  private sessionCookie: string | null = null;
  private deviceReceiptLineKey: string | null = null;
  private apiBaseUrl: string = "https://proxy-bwt.netlify.app";

  constructor() {
    // Check if credentials and session cookie are stored in localStorage
    const storedCredentials = localStorage.getItem('bwt-credentials');
    const storedSessionCookie = localStorage.getItem('bwt-session-cookie');
    const storedDeviceKey = localStorage.getItem('bwt-device-key');
    
    if (storedCredentials) {
      this.credentials = JSON.parse(storedCredentials);
      this.isAuthenticated = storedSessionCookie !== null;
      this.sessionCookie = storedSessionCookie;
      this.deviceReceiptLineKey = storedDeviceKey;
    }
  }

  setCredentials(credentials: BWTCredentials) {
    this.credentials = credentials;
    localStorage.setItem('bwt-credentials', JSON.stringify(credentials));
  }

  setSessionCookie(cookie: string) {
    this.sessionCookie = cookie;
    localStorage.setItem('bwt-session-cookie', cookie);
    this.isAuthenticated = true;
  }

  setDeviceKey(key: string) {
    this.deviceReceiptLineKey = key;
    localStorage.setItem('bwt-device-key', key);
  }

  removeCredentials() {
    this.credentials = null;
    this.sessionCookie = null;
    this.deviceReceiptLineKey = null;
    localStorage.removeItem('bwt-credentials');
    localStorage.removeItem('bwt-session-cookie');
    localStorage.removeItem('bwt-device-key');
    this.isAuthenticated = false;
  }

  hasCredentials(): boolean {
    return this.isAuthenticated && this.credentials !== null && this.sessionCookie !== null;
  }

  getCredentials(): BWTCredentials | null {
    return this.credentials;
  }

  async login(credentials: BWTCredentials): Promise<boolean> {
    try {
      const date = new Date().toISOString();
      // Using a proxy server to avoid CORS issues
      const response = await fetch(`${this.apiBaseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password,
          date: date
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur d'authentification: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Store session cookie from the response
        if (data.cookie) {
          this.setSessionCookie(data.cookie);
        }
        
        // Set device key if available
        if (data.deviceKey) {
          this.setDeviceKey(data.deviceKey);
        } else {
          // If not provided, use a default or previously stored one
          if (!this.deviceReceiptLineKey) {
            this.setDeviceKey('00248808:1781377');
          }
        }
        
        this.setCredentials(credentials);
        
        // Show success toast with date
        toast({
          title: "Connexion réussie",
          description: `Vous êtes connecté à votre compte BWT. ${new Date().toLocaleString('fr-FR')}`,
        });
        
        return true;
      } else {
        throw new Error(data.message || "Échec d'authentification");
      }
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      
      toast({
        title: "Erreur de connexion",
        description: `${errorMessage} - ${new Date().toLocaleString('fr-FR')}`,
        variant: "destructive",
      });
      
      return false;
    }
  }

  async fetchWaterConsumptionData(): Promise<WaterConsumptionData[]> {
    if (!this.hasCredentials()) {
      throw new Error("Non authentifié");
    }

    try {
      // Vérifier si nous avons une clé de dispositif
      if (!this.deviceReceiptLineKey) {
        throw new Error("Clé de dispositif non disponible");
      }

      // Faire une requête en utilisant le proxy pour éviter les problèmes CORS
      const url = `${this.apiBaseUrl}/device/ajaxChart`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cookie: this.sessionCookie,
          receiptLineKey: this.deviceReceiptLineKey
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur de récupération des données: ${response.status}`);
      }

      const data = await response.json();
      
      // Afficher une notification avec la date
      toast({
        title: "Données récupérées",
        description: `Données de consommation d'eau mises à jour - ${new Date().toLocaleString('fr-FR')}`,
      });
      
      // Traiter les données pour correspondre à notre format
      return this.processDeviceData(data.dataset);
    } catch (error) {
      console.error("Error fetching water consumption data:", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      
      toast({
        title: "Erreur de récupération des données",
        description: `${errorMessage} - ${new Date().toLocaleString('fr-FR')}`,
        variant: "destructive",
      });
      
      throw error;
    }
  }

  private processDeviceData(data: BWTDeviceData): WaterConsumptionData[] {
    if (!data || !data.deviceDataHistory || !data.deviceDataHistory.lines) {
      throw new Error("Données invalides reçues de BWT");
    }

    const { codes, lines } = data.deviceDataHistory;
    
    // Trouver les indices des champs requis
    const waterIndex = codes.indexOf('waterUse');
    const regenCountIndex = codes.indexOf('regenCount');
    const powerOutageIndex = codes.indexOf('powerOutage');
    const saltAlarmIndex = codes.indexOf('saltAlarm');
    
    // S'assurer que nous avons les champs requis
    if (waterIndex === -1 || regenCountIndex === -1 || powerOutageIndex === -1 || saltAlarmIndex === -1) {
      throw new Error("Certains champs requis sont manquants dans les données");
    }
    
    // Transformer les lignes en objets WaterConsumptionData
    return lines.map(line => ({
      date: line[0] as string,
      consumption: line[waterIndex] as number,
      regenCount: line[regenCountIndex] as number,
      powerOutage: line[powerOutageIndex] as boolean,
      saltAlarm: line[saltAlarmIndex] as boolean
    }));
  }
}

export default new BWTService();
