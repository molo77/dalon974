export interface Actualite {
  id: number;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  readTime: string;
  image: string;
  source?: string;
  url?: string;
}

export class ActualitesService {
  private static instance: ActualitesService;
  private cache: Actualite[] = [];
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 heures

  private constructor() {}

  public static getInstance(): ActualitesService {
    if (!ActualitesService.instance) {
      ActualitesService.instance = new ActualitesService();
    }
    return ActualitesService.instance;
  }

  public async getActualites(): Promise<Actualite[]> {
    const now = Date.now();
    
    // Vérifier si le cache est encore valide
    if (this.cache.length > 0 && (now - this.lastFetch) < this.CACHE_DURATION) {
      return this.cache;
    }

    try {
      // Récupérer les actualités dynamiques
      const actualites = await this.fetchActualitesDynamiques();
      this.cache = actualites;
      this.lastFetch = now;
      return actualites;
    } catch (error) {
      console.error('Erreur lors de la récupération des actualités:', error);
      // Retourner les actualités par défaut en cas d'erreur
      return this.getActualitesParDefaut();
    }
  }

  private async fetchActualitesDynamiques(): Promise<Actualite[]> {
    // Simuler une récupération d'actualités dynamiques
    // Dans un vrai projet, ceci ferait appel à une API ou un service externe
    const actualitesDynamiques: Actualite[] = [
      {
        id: 1,
        title: "Keylodge Living révolutionne la colocation à La Réunion",
        excerpt: "Lancement en septembre 2024 d'un service de colocation sécurisée avec garantie de loyers pour les propriétaires et entretien régulier des biens.",
        date: "15 Janvier 2025",
        category: "Innovation",
        readTime: "4 min",
        image: "/images/keylodge-living.jpg",
        source: "Megazap.fr",
        url: "https://www.megazap.fr/La-revolution-dans-la-location-et-la-colocation-a-La-Reunion-avec-Keylodge_a12894.html"
      },
      {
        id: 2,
        title: "Boom de la colocation : +20% en 5 ans à La Réunion",
        excerpt: "Plus de 10 000 personnes engagées dans des contrats de colocation sur l'île, porté par la croissance étudiante et des jeunes actifs.",
        date: "12 Janvier 2025",
        category: "Tendances",
        readTime: "6 min",
        image: "/images/boom-colocation-reunion.jpg",
        source: "HabiterParis.fr",
        url: "https://www.habiterparis.fr/colocation-a-la-reunion-un-marche-porteur-pour-investisseurs-immobiliers/"
      },
      {
        id: 3,
        title: "La Kaz : plateforme 100% réunionnaise pour la colocation",
        excerpt: "Nouvelle plateforme locale avec géolocalisation précise et système de matching intelligent basé sur le style de vie et le budget.",
        date: "10 Janvier 2025",
        category: "Services",
        readTime: "5 min",
        image: "/images/la-kaz-platform.jpg",
        source: "La-Kaz.re",
        url: "https://www.la-kaz.re/"
      },
      {
        id: 4,
        title: "Colocation intergénérationnelle : nouvelle tendance à La Réunion",
        excerpt: "Mise en relation d'étudiants avec des seniors, favorisant des échanges enrichissants et des solutions de logement innovantes.",
        date: "8 Janvier 2025",
        category: "Innovation",
        readTime: "7 min",
        image: "/images/colocation-intergenerationnelle.jpg",
        source: "HabiterParis.fr",
        url: "https://www.habiterparis.fr/colocation-a-la-reunion-un-marche-porteur-pour-investisseurs-immobiliers/"
      },
      {
        id: 5,
        title: "Prix des colocations 2025 : guide complet par ville",
        excerpt: "Saint-Denis centre : 400-600€, Saint-Paul/Saint-Leu : 350-500€, Saint-Pierre : 300-450€, Saint-André : 250-400€ par mois.",
        date: "5 Janvier 2025",
        category: "Prix",
        readTime: "8 min",
        image: "/images/prix-colocation-2025.jpg",
        source: "La-Kaz.re",
        url: "https://www.la-kaz.re/"
      },
      {
        id: 6,
        title: "Aides CAF pour colocation : ce qui change en 2025",
        excerpt: "Nouvelles modalités de calcul des APL et ALS pour les colocataires, avec prise en compte des ressources individuelles et du loyer partagé.",
        date: "3 Janvier 2025",
        category: "Aides",
        readTime: "6 min",
        image: "/images/aides-caf-colocation.jpg",
        source: "CAF Réunion",
        url: "https://www.caf.fr/"
      }
    ];

    // Simuler un délai de récupération
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return actualitesDynamiques;
  }

  private getActualitesParDefaut(): Actualite[] {
    return [
      {
        id: 1,
        title: "Marché de la colocation en pleine expansion à La Réunion",
        excerpt: "La demande en colocation augmente de 20% par an, portée par les étudiants et jeunes actifs.",
        date: "20 Janvier 2025",
        category: "Tendances",
        readTime: "5 min",
        image: "/images/expansion-colocation.jpg"
      },
      {
        id: 2,
        title: "Nouveaux services de colocation sécurisée",
        excerpt: "Des plateformes innovantes proposent des garanties et un accompagnement personnalisé.",
        date: "18 Janvier 2025",
        category: "Services",
        readTime: "4 min",
        image: "/images/services-colocation.jpg"
      },
      {
        id: 3,
        title: "Guide des prix colocation par ville en 2025",
        excerpt: "Découvrez les tarifs moyens des colocations dans les principales villes de La Réunion.",
        date: "15 Janvier 2025",
        category: "Prix",
        readTime: "6 min",
        image: "/images/prix-colocation.jpg"
      }
    ];
  }

  public async getActualiteById(id: number): Promise<Actualite | null> {
    const actualites = await this.getActualites();
    return actualites.find(actualite => actualite.id === id) || null;
  }

  public async getActualitesByCategory(category: string): Promise<Actualite[]> {
    const actualites = await this.getActualites();
    return actualites.filter(actualite => actualite.category === category);
  }

  public clearCache(): void {
    this.cache = [];
    this.lastFetch = 0;
  }
}

// Export de l'instance singleton
export const actualitesService = ActualitesService.getInstance();
