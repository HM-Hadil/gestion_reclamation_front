// Assurez-vous que ce fichier est bien votre modèle Angular (par exemple, src/app/models/intervention.model.ts)

export interface ReclamationDetails {
    id: number;
    category: string;
    lieu: string;
    laboratoire: string | null;
    description_generale: string;
    date_creation: string; // Ou Date si vous convertissez
    status: 'en_attente' | 'en_cours' | 'termine'; // Assurez-vous que les statuts correspondent
    // Ajoutez d'autres détails spécifiques si votre serializer les inclut
    details_specifiques?: { // Optionnel, car il peut ne pas y en avoir pour toutes les catégories
        type_probleme?: string;
        description_probleme?: string;
        // Ajoutez d'autres champs spécifiques si nécessaire
    };
}
// src/app/models/Intervention.ts (Your existing model file)



export interface Intervention {
    id: number;
    reclamation: number;
    technicien: number;
    technicien_nom?: string;
    description?: string;
    date_debut: string;
    date_fin?: string;
    action_effectuee?: string;
    probleme_constate?: string;
    analyse_cause?: string;
    actions_entreprises?: string;
    pieces_remplacees?: string;
    resultat_tests?: string;
    recommandations?: string;
    mots_cles?: string;
    fichier_joint?: string; // URL for the attached file
    rapport_pdf?: string; // URL for the generated PDF report

    reclamation_details?: ReclamationDetails;

    // InterventionFormData interface remains the same for form handling
}
export interface InterventionFormData {
    reclamation: number;
    technicien?: number; // Peut être optionnel si défini par le backend
    intervenantNom: string; // Utilisé dans le formulaire, peut ne pas correspondre directement à un champ backend pour la création
    dateIntervention: string; // Utilisé dans le formulaire, peut ne pas correspondre directement à un champ backend pour la création
    problemeConstate: string; // Mappe à probleme_constate backend
    verificationsEffectuees: string; // Mappe à analyse_cause backend
    actionsCorrectives: string; // Mappe à actions_entreprises backend
    piecesRechange: string; // Mappe à pieces_remplacees backend
    dateCloture: string; // Utilisé dans le formulaire, peut ne pas correspondre directement à date_fin (défini par terminer())
    resultatsTests: string; // Mappe à resultat_tests backend
    recommandations: string; // Mappe à recommandations backend
    motsCles: string; // Mappe à mots_cles backend
    fichiersJoints: File[]; // Pour l'upload, mappe à fichier_joint backend
    actionEffectuee?: string; // Mappe à action_effectuee backend
}
