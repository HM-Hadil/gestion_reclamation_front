// src/app/models/reclamation.model.ts

// Types de base
export interface BaseReclamation {
  id: number;
  user: number;
  date_creation: string;
  status: 'en_attente' | 'en_cours' | 'termine';
  category: 'pc' | 'electrique' | 'divers' | null;
  description_generale: string | null;
  lieu: 'labo' | 'salle' | 'bureau';
  laboratoire: number | null;
  equipement: number | null;
}

// Détails pour réclamation PC
export interface ReclamationPCDetails {
  id?: number;
  reclamation?: number;
  laboId:number | null;
  type_probleme: 'materiel' | 'logiciel';
  description_probleme: string | null;
}

// Détails pour réclamation électrique
export interface ReclamationElectriqueDetails {
  id?: number;
  reclamation?: number;
  type_probleme: 'climatiseur' | 'coupure_courant' | 'autre';
  description_probleme: string | null;
}

// Détails pour réclamation divers
export interface ReclamationDiversDetails {
  id?: number;
  reclamation?: number;
  type_probleme: 'tableau_blanc' | 'video_projecteur' | 'autre';
  description_probleme: string | null;
}

// Interface complète d'une réclamation avec ses détails
export interface Reclamation extends BaseReclamation {
  pc_details?: ReclamationPCDetails;
  electrique_details?: ReclamationElectriqueDetails;
  divers_details?: ReclamationDiversDetails;
}

// Types pour la création de réclamations
export interface CreateReclamationRequest {
  lieu: 'labo' | 'salle' | 'bureau';
  laboratoire?: number | null;
  salle?: number | null;      // Ajout du champ manquant
  bureau?: number | null;     // Ajout du champ manquant
  equipement?: number | null;
  category: 'pc' | 'electrique' | 'divers';
  description_generale?: string | null;
  status?: 'en_attente' | 'en_cours' | 'termine';
  pc_details?: ReclamationPCDetails;
  electrique_details?: ReclamationElectriqueDetails;
  divers_details?: ReclamationDiversDetails;
}

// Types pour les statistiques
export interface ReclamationStats {
  total_reclamations: number;
  category_stats: {
    pc: number;
    electrique: number;
    divers: number;
  };
  statut_stats: {
    en_attente: number;
    en_cours: number;
    termine: number;
  };
}

// Interface pour les statistiques d'analyse
export interface AnalyseStatistique {
  pannes_par_mois: PanneParMois[];
  equipements_defaillants: EquipementDefaillant[];
  taux_interventions_par_technicien: InterventionTechnicien[];
  temps_moyen_resolution: number;
  statistiques_par_laboratoire: StatistiqueLaboratoire[];
  statistiques_par_categorie: StatistiqueCategorie[];
}

export interface PanneParMois {
  mois: string;
  total: number;
}

export interface EquipementDefaillant {
  equipement__identificateur: string;
  equipement__type: string;
  total_pannes: number;
}

export interface InterventionTechnicien {
  technicien_id: number;
  technicien_nom: string;
  total_interventions: number;
  interventions_reussies: number;
  taux_reussite: number;
}

export interface StatistiqueLaboratoire {
  laboratoire_id: number;
  laboratoire_nom: string;
  total_reclamations: number;
  reclamations_en_attente: number;
  reclamations_en_cours: number;
  reclamations_terminees: number;
  temps_moyen_resolution: number;
  taux_resolution: number;
}

export interface StatistiqueCategorie {
  categorie: string;
  total_reclamations: number;
  reclamations_terminees: number;
  taux_resolution: number;
}

// Interfaces pour les objets liés
export interface Laboratoire {
  id: number;
  nom: string;
  modele_postes?: string;
  processeur?: string;
  memoire_ram?: string;
  stockage?: string;
}

export interface Equipement {
  id: number;
  laboratoire: number;
  type: 'pc' | 'electrique' | 'divers';
  identificateur: string;
}