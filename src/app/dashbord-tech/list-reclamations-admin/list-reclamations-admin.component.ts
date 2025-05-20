import { Component, OnInit } from '@angular/core';
import { ReclamationService } from '../../services/reclamation.service';
import { InterventionService } from '../../services/intervention.service';
import { Reclamation } from '../../models/reclamation.model';
import { HttpErrorResponse } from '@angular/common/http';
import { InterventionFormData, Intervention } from 'src/app/models/Intervention';

@Component({
  selector: 'app-list-reclamations-admin',
  templateUrl: './list-reclamations-admin.component.html',
  styleUrls: ['./list-reclamations-admin.component.css']
})
export class ListReclamationsAdminComponent implements OnInit {

  currentSection: string = 'reclamations';
 
  reclamations: Reclamation[] = [];
  filteredReclamations: Reclamation[] = [];
  selectedReclamation: Reclamation | null = null;
 
  isLoading: boolean = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isFilterDropdownVisible: boolean = false;
  showInterventionForm: boolean = false;

  searchTerm: string = '';

  // Modèle pour le formulaire d'intervention 
  interventionFormData: InterventionFormData = {
    reclamation: 0,
    intervenantNom: '',
    dateIntervention: new Date().toISOString().split('T')[0],
    problemeConstate: '',
    verificationsEffectuees: '',
    actionsCorrectives: '',
    piecesRechange: '',
    dateCloture: new Date().toISOString().split('T')[0],
    resultatsTests: '',
    recommandations: '',
    motsCles: '',
    fichiersJoints: [],
    actionEffectuee: 'reparation' // Valeur par défaut
  };

  constructor(
    private reclamationService: ReclamationService,
    private interventionService: InterventionService
  ) { }

  ngOnInit(): void {
    this.loadAllReclamations();
  }

  loadAllReclamations(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.reclamationService.AllfilterdReclamations().subscribe({
      next: (data) => {
        this.reclamations = data;
        this.filteredReclamations = data;
        this.isLoading = false;
        
        // Pour chaque réclamation, vérifier si elle a des interventions
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = `Erreur lors de la récupération des réclamations: ${error.message}`;
        this.isLoading = false;
        console.error(error);
      }
    });
  }
  


  // Méthode pour la barre de recherche
  onSearchChange(): void {
    if (!this.searchTerm) {
      this.filteredReclamations = [...this.reclamations];
    } else {
      const lowerSearchTerm = this.searchTerm.toLowerCase();
      this.filteredReclamations = this.reclamations.filter(reclamation =>
        (reclamation.id.toString().includes(lowerSearchTerm)) ||
        (reclamation.description_generale && reclamation.description_generale.toLowerCase().includes(lowerSearchTerm)) ||
        (reclamation.lieu && reclamation.lieu.toLowerCase().includes(lowerSearchTerm)) ||
        (reclamation.category && reclamation.category.toLowerCase().includes(lowerSearchTerm))
      );
    }
  }

  toggleFilterDropdown(): void {
    this.isFilterDropdownVisible = !this.isFilterDropdownVisible;
  }

  // Méthodes de filtrage
  filterByDate(): void {
    this.filteredReclamations.sort((a, b) => new Date(b.date_creation).getTime() - new Date(a.date_creation).getTime());
    this.isFilterDropdownVisible = false;
  }

  filterByLieu(lieu?: 'labo' | 'salle' | 'bureau'): void {
    if (lieu) {
        this.reclamationService.filterReclamations(lieu).subscribe(this.handleFilterResponse);
    } else {
        this.filteredReclamations = [...this.reclamations];
    }
    this.isFilterDropdownVisible = false;
  }

  filterByStatut(statut?: 'en_attente' | 'en_cours' | 'termine'): void {
    if (statut) {
        this.reclamationService.filterReclamations(undefined, undefined, statut).subscribe(this.handleFilterResponse);
    } else {
        this.filteredReclamations = [...this.reclamations];
    }
    this.isFilterDropdownVisible = false;
  }
 
  private handleFilterResponse = {
    next: (data: Reclamation[]) => {
      this.filteredReclamations = data;
      this.isLoading = false;
    },
    error: (error: HttpErrorResponse) => {
      this.errorMessage = `Erreur lors du filtrage : ${error.message}`;
      this.isLoading = false;
      console.error(error);
    }
  };

  openDetails(reclamation: Reclamation): void {
    this.selectedReclamation = reclamation;
    this.showInterventionForm = false;
  }

  closeModal(): void {
    this.selectedReclamation = null;
    this.showInterventionForm = false;
  }

  handleIntervention(reclamation: Reclamation): void {
    // Assurez-vous que la réclamation est sélectionnée
    if (!this.selectedReclamation || this.selectedReclamation.id !== reclamation.id) {
        this.selectedReclamation = reclamation;
    }
    this.showInterventionForm = true;
    
    // Réinitialiser le formulaire avec les valeurs par défaut
    this.interventionFormData = {
      reclamation: reclamation.id,
      intervenantNom: '',
      dateIntervention: new Date().toISOString().split('T')[0],
      problemeConstate: '',
      verificationsEffectuees: '',
      actionsCorrectives: '',
      piecesRechange: '',
      dateCloture: new Date().toISOString().split('T')[0],
      resultatsTests: '',
      recommandations: '',
      motsCles: '',
      fichiersJoints: [],
      actionEffectuee: 'reparation' // Valeur par défaut
    };
  }

  onFileSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    let fileList: FileList | null = element.files;
    if (fileList) {
      this.interventionFormData.fichiersJoints = Array.from(fileList);
      console.log('Fichiers sélectionnés:', this.interventionFormData.fichiersJoints);
    }
  }

  validateIntervention(): void {
    if (!this.selectedReclamation) {
      this.errorMessage = "Aucune réclamation sélectionnée pour l'intervention.";
      return;
    }
    
    this.isLoading = true;
    this.errorMessage = null;

    console.log("Données du rapport d'intervention à valider :", this.interventionFormData);
 
    // Préparation des données à envoyer avec FormData
    const formData = new FormData();
    
    // Ajout des champs de base
    formData.append('reclamation', this.selectedReclamation.id.toString());
    formData.append('technicien_nom', this.interventionFormData.intervenantNom);
    formData.append('date_debut', this.interventionFormData.dateIntervention);
    formData.append('date_fin', this.interventionFormData.dateCloture);
    formData.append('probleme_constate', this.interventionFormData.problemeConstate);
    formData.append('analyse_cause', this.interventionFormData.verificationsEffectuees);
    formData.append('actions_entreprises', this.interventionFormData.actionsCorrectives);
    formData.append('pieces_remplacees', this.interventionFormData.piecesRechange);
    formData.append('resultat_tests', this.interventionFormData.resultatsTests);
    formData.append('recommandations', this.interventionFormData.recommandations);
    formData.append('mots_cles', this.interventionFormData.motsCles);
    formData.append('action_effectuee', this.interventionFormData.actionEffectuee || 'reparation');
    
    // Ajout des fichiers - CORRECTION : Un seul fichier dans le modèle, mais possibilité d'en joindre plusieurs
    if (this.interventionFormData.fichiersJoints.length > 0) {
      // Premier fichier pour le champ fichier_joint
      formData.append('fichier_joint', this.interventionFormData.fichiersJoints[0]);
      
      // Si plus d'un fichier, on les ajoute avec un autre nom de champ
      // Note: La gestion de plusieurs fichiers nécessitera des ajustements dans le backend
      for (let i = 1; i < this.interventionFormData.fichiersJoints.length; i++) {
        formData.append(`fichier_joint_annexe_${i}`, this.interventionFormData.fichiersJoints[i]);
      }
    }

    // Création d'une nouvelle intervention
    this.interventionService.createIntervention(formData).subscribe({
      next: (intervention: Intervention) => {
        console.log('Intervention créée avec succès:', intervention);
        
        // Générer le rapport PDF
        this.generateInterventionReport(intervention.id);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = `Erreur lors de la création de l'intervention : ${error.message || 'Erreur inconnue'}`;
        console.error(error);
      }
    });
  }

  private generateInterventionReport(interventionId: number): void {
    // Création d'un FormData vide car toutes les données sont déjà sauvegardées
    const formData = new FormData();

    this.interventionService.completeInterventionReport(interventionId, formData).subscribe({
      next: (blob: Blob) => {
        this.isLoading = false;
        
        // Créer un URL pour le blob
        const url = window.URL.createObjectURL(blob);
        
        // Ouvrir le PDF dans un nouvel onglet
        window.open(url);
        
        // Mise à jour du statut de la réclamation
        this.updateReclamationStatus();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = `Erreur lors de la génération du rapport PDF : ${error.message || 'Erreur inconnue'}`;
        console.error(error);
      }
    });
  }

  private updateReclamationStatus(): void {
    if (!this.selectedReclamation) return;
    
    const updatedData = {
      status: 'termine' as 'en_attente' | 'en_cours' | 'termine'
    };

    this.reclamationService.updateReclamation(this.selectedReclamation.id, updatedData).subscribe({
      next: (updatedReclamation) => {
        // Mise à jour des données locales
        const index = this.reclamations.findIndex(r => r.id === updatedReclamation.id);
        if (index !== -1) {
          this.reclamations[index] = updatedReclamation;
          // Mise à jour dans filteredReclamations également
          const filteredIndex = this.filteredReclamations.findIndex(r => r.id === updatedReclamation.id);
          if (filteredIndex !== -1) {
            this.filteredReclamations[filteredIndex] = updatedReclamation;
          }
        }
        
        // Recharger les interventions pour voir les résultats immédiatement
        
        // Fermer la modale après validation
        this.closeModal();
        
        // Afficher un message de confirmation
        this.showSuccessMessage('Intervention enregistrée et rapport généré avec succès');
      },
      error: (error) => {
        this.errorMessage = `Erreur lors de la mise à jour du statut : ${error.message || 'Erreur inconnue'}`;
        console.error(error);
      }
    });
  }

  // Méthode pour afficher un message de succès
  private showSuccessMessage(message: string): void {
    this.successMessage = message;
    
    // Faire disparaître le message après quelques secondes
    setTimeout(() => {
      this.successMessage = null;
    }, 5000);
  }

  // Méthode pour obtenir le titre de la réclamation
  getReclamationTitle(reclamation: Reclamation): string {
    if (reclamation.description_generale && reclamation.description_generale.length > 50) {
        return reclamation.description_generale.substring(0, 50) + '...';
    }
    return reclamation.description_generale || `Réclamation #${reclamation.id}`;
  }

  // Méthode pour obtenir la description complète
  getReclamationFullDescription(reclamation: Reclamation | null): string {
      if (!reclamation) return '';
     
      let description = reclamation.description_generale || 'N/A';
     
      if (reclamation.category === 'pc' && reclamation.pc_details) {
          description += `\nType de problème PC: ${reclamation.pc_details.type_probleme}. \nDétails: ${reclamation.pc_details.description_probleme || 'Non spécifié'}`;
      } else if (reclamation.category === 'electrique' && reclamation.electrique_details) {
          description += `\nType de problème électrique: ${reclamation.electrique_details.type_probleme}. \nDétails: ${reclamation.electrique_details.description_probleme || 'Non spécifié'}`;
      } else if (reclamation.category === 'divers' && reclamation.divers_details) {
          description += `\nType de problème divers: ${reclamation.divers_details.type_probleme}. \nDétails: ${reclamation.divers_details.description_probleme || 'Non spécifié'}`;
      }
      return description;
  }
}