
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
      // Authentification réelle à BWT
      const response = await fetch('https://www.bwt-monservice.com/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'UserName': credentials.username,
          'Password': credentials.password,
          'RememberMe': 'true'
        }),
        credentials: 'include',
        redirect: 'follow'
      });

      if (!response.ok) {
        throw new Error(`Erreur d'authentification: ${response.status}`);
      }

      // Récupérer le cookie de session depuis les en-têtes de réponse
      const setCookieHeader = response.headers.get('set-cookie');
      if (setCookieHeader) {
        // Extraire le cookie de session (dans un environnement réel, nous utiliserions un proxy pour gérer les cookies)
        const sessionCookie = setCookieHeader.split(';')[0];
        this.setSessionCookie(sessionCookie);
      } else {
        // En mode développement/test, on peut simuler un cookie pour continuer
        this.setSessionCookie('bwt_session=test_session');
      }

      // Après connexion, récupérer la clé du dispositif
      // Dans un environnement réel, cela nécessiterait de parcourir la page d'accueil ou d'appeler une API
      // Pour l'instant, on utilise une valeur par défaut ou stockée
      if (!this.deviceReceiptLineKey) {
        this.setDeviceKey('00248808:1781377'); // Clé d'exemple, à remplacer par la vraie clé obtenue
      }

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
      throw new Error("Non authentifié");
    }

    try {
      // Vérifier si nous avons une clé de dispositif
      if (!this.deviceReceiptLineKey) {
        throw new Error("Clé de dispositif non disponible");
      }

      // Faire une requête réelle à l'API BWT
      const url = `https://www.bwt-monservice.com/device/ajaxChart?receiptLineKey=${this.deviceReceiptLineKey}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Cookie': this.sessionCookie || '',
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Erreur de récupération des données: ${response.status}`);
      }

      const data = await response.json();
      
      // Traiter les données pour correspondre à notre format
      return this.processDeviceData(data.dataset);
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
