import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import * as saveAs from 'file-saver';
import { Intervention } from 'src/app/models/Intervention';
import { InterventionService } from 'src/app/services/intervention.service';

function getCurrentUserId(): number | null {
  // --- REMPLACER PAR VOTRE LOGIQUE RÉELLE ---
  const token = localStorage.getItem('token');
  if (!token) {
    console.warn("No JWT token found in localStorage.");
    return null;
  }
  try {
    const payload = token.split('.')[1];
    const decodedPayload = atob(payload);
    const payloadObject = JSON.parse(decodedPayload);
    const userId = payloadObject.user_id; // Or payloadObject.id, payloadObject.sub
    if (typeof userId === 'number') {
      console.log("Successfully extracted user ID from token:", userId);
      return userId;
    } else {
      console.error("User ID not found or is not a number in JWT payload:", userId);
      return null;
    }
  } catch (e) {
    console.error("Failed to decode or parse JWT token:", e);
    return null;
  }
}

@Component({
  selector: 'app-list-others-interventions',
  templateUrl: './list-others-interventions.component.html',
  styleUrls: ['./list-others-interventions.component.css']
})
export class ListOthersInterventionsComponent {

    interventions: Intervention[] = [];
    filteredInterventions: Intervention[] = [];
    searchTerm: string = '';
  
    isLoading: boolean = false;
    errorMessage: string | null = null;
    successMessage: string | null = null;
  
    selectedIntervention: Intervention | null = null;
    showDetailsModal: boolean = false;
  
  
    constructor(private interventionService: InterventionService) { }
  
    ngOnInit(): void {
      this.loadotherInterventions();
    }
  
    loadotherInterventions(): void {
      const userId = getCurrentUserId();
  
      if (userId === null) {
        this.errorMessage = "Impossible d'identifier l'utilisateur. Veuillez vous connecter.";
        this.isLoading = false;
        return;
      }
  
      this.isLoading = true;
      this.errorMessage = null;
      this.successMessage = null;
  
      // Call the service method to get interventions for the current user
      // This service call should fetch Intervention objects that include the fichier_joint and rapport_pdf URLs
      this.interventionService.getOtherUsersInterventions().subscribe({
        next: (data: any) => {
          console.log('Raw response data:', data); // Pour déboguer la structure des données
          
          // Vérifier si la réponse est un tableau ou un objet contenant un tableau
          if (Array.isArray(data)) {
            this.interventions = data;
          } else if (data && Array.isArray(data.results)) {
            // Si la réponse est paginée avec une structure { results: [...], count: ..., next: ..., previous: ... }
            this.interventions = data.results;
          } else if (data && Array.isArray(data.interventions)) {
            // Si la réponse a une structure { interventions: [...] }
            this.interventions = data.interventions;
          } else {
            // Si aucune structure attendue n'est trouvée, initialiser avec un tableau vide
            console.warn('Unexpected data structure:', data);
            this.interventions = [];
          }
          
          console.log('Processed interventions:', this.interventions);
          this.applyFilter(); // Initialize the filtered list
          this.isLoading = false;
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage = `Erreur lors de la récupération de vos interventions : ${error.message || 'Erreur inconnue'}`;
          this.isLoading = false;
          console.error('Error details:', error);
          // Initialiser avec un tableau vide en cas d'erreur
          this.interventions = [];
          this.filteredInterventions = [];
        }
      });
    }
  
    applyFilter(): void {
      // Vérifier que interventions est bien un tableau avant de filtrer
      if (!Array.isArray(this.interventions)) {
        console.warn('interventions is not an array:', this.interventions);
        this.filteredInterventions = [];
        return;
      }

      if (!this.searchTerm || this.searchTerm.trim() === '') {
        this.filteredInterventions = [...this.interventions];
        return;
      }
      
      const lowerSearchTerm = this.searchTerm.toLowerCase().trim();
      this.filteredInterventions = this.interventions.filter(intervention => {
        const isMatch =
          intervention.probleme_constate?.toLowerCase().includes(lowerSearchTerm) ||
          intervention.analyse_cause?.toLowerCase().includes(lowerSearchTerm) ||
          intervention.actions_entreprises?.toLowerCase().includes(lowerSearchTerm) ||
          intervention.mots_cles?.toLowerCase().includes(lowerSearchTerm);
        return isMatch;
      });
    }
  
    openDetails(intervention: Intervention): void {
      this.selectedIntervention = intervention;
      this.showDetailsModal = true;
    }
  
    closeDetailsModal(): void {
      this.selectedIntervention = null;
      this.showDetailsModal = false;
      // Optional: Refresh the list after closing modal if data might have changed
      // this.loadMyInterventions();
    }
  
    // --- New method to download the attached file ---
    downloadJointFile(intervention: Intervention): void {
      if (intervention.fichier_joint) {
        try {
          // Use saveAs with the URL directly
          // The browser will handle fetching the file from the URL and downloading it.
          // You can optionally provide a desired filename as the second argument to saveAs.
          // Extract filename from URL or provide a default/structured name
          const filename = intervention.fichier_joint.split('/').pop() || `fichier_joint_${intervention.id}`;
          saveAs(intervention.fichier_joint, filename);
          this.showSuccessMessage(`Téléchargement de "${filename}" initié.`);
        } catch (e) {
          console.error("Error initiating file download:", e);
          this.errorMessage = `Erreur lors du téléchargement du fichier joint : ${e}`;
        }
      } else {
        this.errorMessage = "Aucun fichier joint disponible pour cette intervention.";
      }
    }
  
    // --- New method to download the PDF report ---
    downloadReportPdf(intervention: Intervention): void {
      if (intervention.rapport_pdf) {
        try {
          // Use saveAs with the URL directly
          const filename = `rapport_intervention_${intervention.id}.pdf`;
          saveAs(intervention.rapport_pdf, filename);
          this.showSuccessMessage(`Téléchargement du rapport PDF "${filename}" initié.`);
        } catch (e) {
          console.error("Error initiating PDF download:", e);
          this.errorMessage = `Erreur lors du téléchargement du rapport PDF : ${e}`;
        }
      } else {
        this.errorMessage = "Aucun rapport PDF disponible pour cette intervention.";
      }
    }
  
  
    private showSuccessMessage(message: string): void {
      this.successMessage = message;
      setTimeout(() => {
        this.successMessage = null;
      }, 5000);
    }
  
    formatDate(dateString: string | undefined | null): string {
      if (!dateString) return 'N/A';
      try {
         const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
         return new Date(dateString).toLocaleDateString(undefined, options);
      } catch (e) {
         console.error("Invalid date string:", dateString, e);
         return 'Date invalide';
      }
    }
  
    getStatusDisplay(status: string | undefined | null): string {
      if (!status) return 'N/A';
      switch (status) {
        case 'en_attente': return 'En attente';
        case 'en_cours': return 'En cours';
        case 'termine': return 'Terminée';
        default: return status;
      }
    }
}