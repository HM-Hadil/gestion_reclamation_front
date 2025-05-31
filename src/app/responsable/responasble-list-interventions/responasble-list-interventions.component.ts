import { Component, OnInit } from '@angular/core';
import { InterventionService } from 'src/app/services/intervention.service';

@Component({
  selector: 'app-responasble-list-interventions',
  templateUrl: './responasble-list-interventions.component.html',
  styleUrls: ['./responasble-list-interventions.component.css']
})
export class ResponasbleListInterventionsComponent implements OnInit {

  interventions: any[] = [];
  filteredInterventions: any[] = [];
  isLoading: boolean = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  searchTerm: string = '';
  showDetailsModal: boolean = false;
  selectedIntervention: any = null;

  constructor(
    private interventionService: InterventionService,
  ) { }

  ngOnInit(): void {
    this.loadInterventions();
  }

  loadInterventions() {
    this.isLoading = true;
    this.errorMessage = null;
    
    this.interventionService.getAllInterventions().subscribe({
      next: (data) => {
        console.log('Données reçues:', data); // Pour déboguer
        
        // Vérifier si data est un tableau ou un objet avec une propriété contenant le tableau
        if (Array.isArray(data)) {
          this.interventions = data;
        } else if (data && typeof data === 'object') {
          // Si la réponse est un objet, chercher la propriété contenant les interventions
          // Propriétés communes: results, data, interventions, items
          if (data && Array.isArray(data)) {
            this.interventions = data;
          }  else {
            // Si aucune propriété standard n'est trouvée, prendre la première propriété qui est un tableau
            const arrayProperty = Object.keys(data).find(key => Array.isArray(data[key]));
            if (arrayProperty) {
              this.interventions = data[arrayProperty];
            } else {
              console.error('Structure de données non reconnue:', data);
              this.interventions = [];
              this.errorMessage = "Format de données non reconnu.";
            }
          }
        } else {
          console.error('Données reçues ne sont ni un tableau ni un objet:', data);
          this.interventions = [];
          this.errorMessage = "Format de données incorrect.";
        }
        
        this.filteredInterventions = [...this.interventions];
        this.isLoading = false;
        
        console.log('Interventions chargées:', this.interventions.length);
      },
      error: (error) => {
        this.errorMessage = "Erreur lors du chargement des interventions. Veuillez réessayer plus tard.";
        this.isLoading = false;
        console.error('Erreur :', error);
        
        // Détails supplémentaires pour le débogage
        if (error.status) {
          console.error('Status HTTP:', error.status);
        }
        if (error.error) {
          console.error('Détails de l\'erreur:', error.error);
        }
      }
    });
  }

  applyFilter() {
    if (!this.searchTerm.trim()) {
      this.filteredInterventions = [...this.interventions];
      return;
    }

    const searchTermLower = this.searchTerm.toLowerCase();
    this.filteredInterventions = this.interventions.filter(intervention => {
      return (
        (intervention.probleme_constate && intervention.probleme_constate.toLowerCase().includes(searchTermLower)) ||
        (intervention.analyse_cause && intervention.analyse_cause.toLowerCase().includes(searchTermLower)) ||
        (intervention.id && intervention.id.toString().includes(searchTermLower)) ||
        // Ajout du filtre par lieu
        (intervention.lieu && intervention.lieu.toLowerCase().includes(searchTermLower)) ||
        (intervention.adresse && intervention.adresse.toLowerCase().includes(searchTermLower)) ||
        (intervention.localisation && intervention.localisation.toLowerCase().includes(searchTermLower)) ||
        // Si lieu est un objet avec des propriétés
        (intervention.lieu && typeof intervention.lieu === 'object' && intervention.lieu.nom && 
         intervention.lieu.nom.toLowerCase().includes(searchTermLower)) ||
        (intervention.lieu && typeof intervention.lieu === 'object' && intervention.lieu.adresse && 
         intervention.lieu.adresse.toLowerCase().includes(searchTermLower))
      );
    });
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'Non définie';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getStatusDisplay(status: string): string {
    switch (status) {
      case 'completed':
        return 'Terminée';
      case 'in_progress':
        return 'En cours';
      case 'pending':
        return 'En attente';
      default:
        return 'Non défini';
    }
  }

  openDetails(intervention: any) {
    this.selectedIntervention = intervention;
    this.showDetailsModal = true;
    // Pour le débogage seulement
    console.log('Intervention sélectionnée:', this.selectedIntervention);
    console.log('Mots-clés:', this.selectedIntervention.mots_cles);
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedIntervention = null;
  }

  getMotsClesArray(intervention: any): string[] {
    if (!intervention || !intervention.mots_cles) return [];
    
    // Si c'est déjà un tableau, on le retourne directement
    if (Array.isArray(intervention.mots_cles)) {
      return intervention.mots_cles.map((mot: string) => mot.trim());
    }
    
    // Si c'est une chaîne de caractères, on la divise
    if (typeof intervention.mots_cles === 'string') {
      // Diviser par virgule ou point-virgule
      return intervention.mots_cles
        .split(/[,;]/)
        .map((mot: string) => mot.trim())
        .filter((mot: string) => mot.length > 0);
    }
    
    return [];
  }

  getFileName(path: string): string {
    if (!path) return '';
    // Extraire le nom du fichier à partir du chemin complet
    const parts = path.split('/');
    return parts[parts.length - 1];
  }

  downloadJointFile(intervention: any) {
    if (!intervention.fichier_joint) {
      return;
    }
    
    window.open(intervention.fichier_joint, '_blank');
  }

  downloadReportPdf(intervention: any) {
    if (!intervention.rapport_pdf) {
      return;
    }
    
    window.open(intervention.rapport_pdf, '_blank');
  }

  // Méthode pour obtenir le lieu d'affichage
  getLieuDisplay(intervention: any): string {
    if (!intervention) return 'Non spécifié';
    
    // Si lieu est une chaîne
    if (typeof intervention.lieu === 'string') {
      return intervention.lieu;
    }
    
    // Si lieu est un objet
    if (intervention.lieu && typeof intervention.lieu === 'object') {
      return intervention.lieu.nom || intervention.lieu.adresse || 'Lieu non spécifié';
    }
    
    // Alternatives
    return intervention.adresse || intervention.localisation || 'Non spécifié';
  }
}