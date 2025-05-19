// src/app/models/gestion.model.ts

export interface PC {
    id: number;
    poste: string;             // Correspond à 'numero' dans l'ancien code
    sn_inventaire: string;     // Correspond à 'serial'
    logiciels_installes: string; // Correspond à 'logiciels' (maintenant une chaîne)
    ecran: string;             // Correspond à 'ecran'
    laboratoire: number;       // ID du laboratoire parent
  }
  
  export interface Laboratoire {
    id: number;
    nom: string;
    modele_postes: string;    // Correspond à 'configuration.modele'
    processeur: string;       // Correspond à 'configuration.cpu'
    memoire_ram: string;      // Correspond à 'configuration.ram'
    stockage: string;         // Correspond à 'configuration.stockage'
    pcs?: PC[];               // Optionnel: Peut contenir les PC chargés séparément
  }
  

  export interface Salle {
    id: number;
    nom: string;
    // Ajoutez d'autres champs si nécessaire
  }
  
  export interface Bureau {
    id: number;
    nom: string;
     // Ajoutez d'autres champs si nécessaire
  }
  
  // Interface pour la création/mise à jour, omettant l'ID généré par le backend
  export type LaboratoireData = Omit<Laboratoire, 'id' | 'pcs'>;
  export type PCData = Omit<PC, 'id'>;