import { Component, OnInit } from '@angular/core';
import { ReclamationService } from '../../services/reclamation.service';
import { InterventionService } from '../../services/intervention.service';
import { AuthService } from 'src/app/auth.service';
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

  // Cache pour les utilisateurs (même logique que le composant responsable)
  usersCache: { [key: number]: any } = {};

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
    private interventionService: InterventionService,
    private userService: AuthService // Ajout du service utilisateur
  ) { }

  ngOnInit(): void {
    this.loadAllReclamations();
  }

  loadAllReclamations(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.reclamationService.AllfilterdReclamations().subscribe({
      next: (data) => {
        console.log('rec', data);
        this.reclamations = data;
        this.filteredReclamations = data;
        // Charger les informations utilisateur pour chaque réclamation
        this.loadUsersInfo();
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = `Erreur lors de la récupération des réclamations: ${error.message}`;
        this.isLoading = false;
        console.error(error);
      }
    });
  }

  // Charger les informations des utilisateurs (même logique que le composant responsable)
  loadUsersInfo(): void {
    const userIds = [...new Set(this.reclamations.map(r => r.user))];
    
    userIds.forEach(userId => {
      if (userId && !this.usersCache[userId]) {
        this.userService.getUserById(userId).subscribe({
          next: (user) => {
            this.usersCache[userId] = user;
          },
          error: (error) => {
            console.error(`Erreur lors de la récupération de l'utilisateur ${userId}:`, error);
          }
        });
      }
    });
  }

  // Obtenir le nom de l'utilisateur (même logique que le composant responsable)
  getUserName(userId: number): string {
    const user = this.usersCache[userId];
    if (user) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || `Utilisateur ${userId}`;
    }
    return `Utilisateur ${userId}`;
  }

  // Obtenir le nom complet avec email pour les détails
  getUserFullName(reclamation: Reclamation): string {
    const user = this.usersCache[reclamation.user];
    if (user) {
      const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
      if (fullName && user.email) {
        return `${fullName} (${user.email})`;
      } else if (fullName) {
        return fullName;
      } else if (user.email) {
        return user.email;
      }
    }
    return `Utilisateur #${reclamation.user}`;
  }

  // Obtenir le nom compact (sans email)
  getUserCompactName(reclamation: Reclamation): string {
    const user = this.usersCache[reclamation.user];
    if (user) {
      const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
      if (fullName) {
        return fullName;
      } else if (user.email) {
        const emailUsername = user.email.split('@')[0];
        return emailUsername;
      }
    }
    return `Utilisateur #${reclamation.user}`;
  }

  // Obtenir l'email de l'utilisateur
  getUserEmail(reclamation: Reclamation): string {
    const user = this.usersCache[reclamation.user];
    if (user?.email) {
      return user.email;
    }
    return 'Email non disponible';
  }

  // Obtenir les initiales de l'utilisateur
  getUserInitials(reclamation: Reclamation): string {
    const user = this.usersCache[reclamation.user];
    if (user) {
      const firstname = user.first_name || '';
      const lastname = user.last_name || '';
      
      if (firstname && lastname) {
        return `${firstname.charAt(0)}${lastname.charAt(0)}`.toUpperCase();
      } else if (firstname) {
        return firstname.charAt(0).toUpperCase();
      } else if (lastname) {
        return lastname.charAt(0).toUpperCase();
      } else if (user.email) {
        return user.email.charAt(0).toUpperCase();
      }
    }
    return 'U';
  }

  // Vérifier si les détails utilisateur sont disponibles
  hasUserDetails(reclamation: Reclamation): boolean {
    const user = this.usersCache[reclamation.user];
    return !!(user && (user.first_name || user.last_name || user.email));
  }

  // Obtenir l'ID utilisateur
  getUserId(reclamation: Reclamation): number {
    return reclamation.user;
  }

  // Obtenir le nom du poste PC si applicable (même logique que le composant responsable)
  getPcPosteName(reclamation: Reclamation): string {
    // Vérifier si c'est dans un labo ET si c'est une réclamation PC
    if (reclamation.lieu === 'labo' && reclamation.category === 'pc' && reclamation.pc_info?.poste) {
      return reclamation.pc_info.poste;
    }
    return '';
  }

  // Méthodes pour le laboratoire - utiliser les mêmes noms de propriétés que le responsable
  getLaboratoireName(reclamation: Reclamation): string {
    // Utiliser laboratoire_details s'il existe, sinon fallback
    if (reclamation.laboratoire_details) {
      return reclamation.laboratoire_details.nom;
    }
    return reclamation.laboratoire ? `Laboratoire #${reclamation.laboratoire}` : 'Non spécifié';
  }

  getLaboratoireDetails(reclamation: Reclamation): string {
    if (reclamation.laboratoire_details) {
      let details = reclamation.laboratoire_details.nom;
      if (reclamation.laboratoire_details.modele_postes) {
        details += ` - Modèle: ${reclamation.laboratoire_details.modele_postes}`;
      }
      if (reclamation.laboratoire_details.processeur) {
        details += ` - CPU: ${reclamation.laboratoire_details.processeur}`;
      }
      if (reclamation.laboratoire_details.memoire_ram) {
        details += ` - RAM: ${reclamation.laboratoire_details.memoire_ram}`;
      }
      return details;
    }
    return 'Informations laboratoire non disponibles';
  }

  // Méthodes pour l'équipement
  getEquipementName(reclamation: Reclamation): string {
    if (reclamation.equipement_details) {
      const nom = reclamation.equipement_details.nom || reclamation.equipement_details.identificateur;
      const type = reclamation.equipement_details.type;
      return `${nom} (${type.toUpperCase()})`;
    }
    return reclamation.equipement ? `Équipement #${reclamation.equipement}` : 'Non spécifié';
  }

  getEquipementIdentifier(reclamation: Reclamation): string {
    if (reclamation.equipement_details) {
      return reclamation.equipement_details.identificateur;
    }
    return reclamation.equipement ? `Équipement #${reclamation.equipement}` : 'Non spécifié';
  }

  getEquipementType(reclamation: Reclamation): string {
    if (reclamation.equipement_details) {
      const typeLabels = {
        'pc': 'Ordinateur',
        'electrique': 'Équipement électrique',
        'divers': 'Équipement divers'
      };
      return typeLabels[reclamation.equipement_details.type] || reclamation.equipement_details.type;
    }
    return 'Type non spécifié';
  }

  // Obtenir le lieu complet avec détails
  getLieuComplet(reclamation: Reclamation): string {
    const lieuBase = reclamation.lieu ? reclamation.lieu.charAt(0).toUpperCase() + reclamation.lieu.slice(1) : 'Non spécifié';
    const lieuExacte = reclamation.lieuExacte ? ` - ${reclamation.lieuExacte}` : '';
    
    // Si c'est un laboratoire, ajouter le nom du labo
    if (reclamation.lieu === 'labo' && reclamation.laboratoire_details) {
      return `${lieuBase} (${reclamation.laboratoire_details.nom})${lieuExacte}`;
    }
    
    return `${lieuBase}${lieuExacte}`;
  }

  // Obtenir la catégorie avec libellé français
  getCategoryLabel(reclamation: Reclamation): string {
    const categoryLabels = {
      'pc': 'Problème informatique',
      'electrique': 'Problème électrique',
      'divers': 'Problème divers'
    };
    return reclamation.category ? categoryLabels[reclamation.category] || reclamation.category : 'Non spécifié';
  }

  // Obtenir le statut avec libellé français
  getStatusLabel(reclamation: Reclamation): string {
    const statusLabels = {
      'en_attente': 'En attente',
      'en_cours': 'En cours',
      'termine': 'Terminé'
    };
    return statusLabels[reclamation.status] || reclamation.status;
  }

  // Méthode pour la barre de recherche - mise à jour pour utiliser le cache utilisateur
  onSearchChange(): void {
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      this.filteredReclamations = [...this.reclamations];
      return;
    }

    const lowerSearchTerm = this.searchTerm.toLowerCase().trim();
    this.filteredReclamations = this.reclamations.filter(reclamation => {
      // Recherche dans l'ID
      const idMatch = reclamation.id.toString().includes(lowerSearchTerm);
      
      // Recherche dans la description générale
      const descriptionMatch = reclamation.description_generale && 
        reclamation.description_generale.toLowerCase().includes(lowerSearchTerm);
      
      // Recherche dans le lieu
      const lieuMatch = reclamation.lieu && 
        reclamation.lieu.toLowerCase().includes(lowerSearchTerm);
      
      // Recherche dans le lieu exacte
      const lieuExacteMatch = reclamation.lieuExacte && 
        reclamation.lieuExacte.toLowerCase().includes(lowerSearchTerm);
      
      // Recherche dans la catégorie
      const categoryMatch = reclamation.category && 
        reclamation.category.toLowerCase().includes(lowerSearchTerm);
      
      // Recherche dans le statut
      const statusMatch = reclamation.status && 
        reclamation.status.toLowerCase().includes(lowerSearchTerm);

      // Recherche dans le nom de l'utilisateur en utilisant le cache
      const userMatch = this.getUserName(reclamation.user).toLowerCase().includes(lowerSearchTerm);

      // Recherche dans l'email de l'utilisateur
      let emailMatch = false;
      const user = this.usersCache[reclamation.user];
      if (user?.email) {
        emailMatch = user.email.toLowerCase().includes(lowerSearchTerm);
      }

      // Recherche dans le nom du laboratoire
      const laboMatch = reclamation.laboratoire_details && 
        reclamation.laboratoire_details.nom.toLowerCase().includes(lowerSearchTerm);

      // Recherche dans le nom de l'équipement
      const equipementMatch = reclamation.equipement_details && 
        (reclamation.equipement_details.nom || reclamation.equipement_details.identificateur)
          .toLowerCase().includes(lowerSearchTerm);

      // Recherche dans l'identificateur de l'équipement
      const identifierMatch = reclamation.equipement_details && 
        reclamation.equipement_details.identificateur.toLowerCase().includes(lowerSearchTerm);

      // Recherche dans le nom du poste PC
      const pcPosteMatch = this.getPcPosteName(reclamation).toLowerCase().includes(lowerSearchTerm);

      return idMatch || descriptionMatch || lieuMatch || lieuExacteMatch || 
             categoryMatch || statusMatch || userMatch || emailMatch || 
             laboMatch || equipementMatch || identifierMatch || pcPosteMatch;
    });
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
        this.reclamationService.AllfilterdReclamations(undefined, undefined, statut).subscribe(this.handleFilterResponse);
    } else {
        this.filteredReclamations = [...this.reclamations];
    }
    this.isFilterDropdownVisible = false;
  }

  resetFilters(): void {
    this.filteredReclamations = [...this.reclamations];
    this.searchTerm = '';
    this.isFilterDropdownVisible = false;
  }

  private handleFilterResponse = {
    next: (data: Reclamation[]) => {
      this.filteredReclamations = data;
      this.loadUsersInfo(); // Recharger les infos utilisateur après filtrage
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
    
    // Ajout des fichiers
    if (this.interventionFormData.fichiersJoints.length > 0) {
      formData.append('fichier_joint', this.interventionFormData.fichiersJoints[0]);
      
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
    const formData = new FormData();

    this.interventionService.completeInterventionReport(interventionId, formData).subscribe({
      next: (blob: Blob) => {
        this.isLoading = false;
        
        const url = window.URL.createObjectURL(blob);
        window.open(url);
        
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
        const index = this.reclamations.findIndex(r => r.id === updatedReclamation.id);
        if (index !== -1) {
          this.reclamations[index] = updatedReclamation;
          const filteredIndex = this.filteredReclamations.findIndex(r => r.id === updatedReclamation.id);
          if (filteredIndex !== -1) {
            this.filteredReclamations[filteredIndex] = updatedReclamation;
          }
        }
        
        this.closeModal();
        this.showSuccessMessage('Intervention enregistrée et rapport généré avec succès');
      },
      error: (error) => {
        this.errorMessage = `Erreur lors de la mise à jour du statut : ${error.message || 'Erreur inconnue'}`;
        console.error(error);
      }
    });
  }

  private showSuccessMessage(message: string): void {
    this.successMessage = message;
    
    setTimeout(() => {
      this.successMessage = null;
    }, 5000);
  }

  getReclamationTitle(reclamation: Reclamation): string {
    if (reclamation.description_generale && reclamation.description_generale.length > 50) {
        return reclamation.description_generale.substring(0, 50) + '...';
    }
    return reclamation.description_generale || `Réclamation #${reclamation.id}`;
  }

  getReclamationFullDescription(reclamation: Reclamation | null): string {
      if (!reclamation) return '';
     
      let description = reclamation.description_generale || 'Non spécifié';
     
      if (reclamation.category === 'pc' && reclamation.pc_details) {
          description += `\nType de problème PC: ${reclamation.pc_details.type_probleme}. \nDétails: ${reclamation.pc_details.description_probleme || 'Non spécifié'}`;
      } else if (reclamation.category === 'electrique' && reclamation.electrique_details) {
          description += `\nType de problème électrique: ${reclamation.electrique_details.type_probleme}. \nDétails: ${reclamation.electrique_details.description_probleme || 'Non spécifié'}`;
      } else if (reclamation.category === 'divers' && reclamation.divers_details) {
          description += `\nType de problème divers: ${reclamation.divers_details.type_probleme}. \nDétails: ${reclamation.divers_details.description_probleme || 'Non spécifié'}`;
      }
      return description;
  }

  // Obtenir la classe CSS de priorité (ajouté pour la cohérence)
  getPrioriteClass(priorite: string): string {
    switch(priorite) {
      case 'Haute': return 'bg-red-100 text-red-800';
      case 'Moyenne': return 'bg-amber-100 text-amber-800';
      case 'Basse': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  // Obtenir la classe CSS de statut (ajouté pour la cohérence)
  getStatutClass(statut: string): string {
    switch(statut) {
      case 'en_attente': return 'bg-red-100 text-red-800';
      case 'en_cours': return 'bg-blue-100 text-blue-800';
      case 'termine': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  // Formater le statut pour l'affichage (ajouté pour la cohérence)
  formatStatut(statut: string): string {
    switch(statut) {
      case 'en_attente': return 'En attente';
      case 'en_cours': return 'En cours';
      case 'termine': return 'Terminé';
      default: return statut;
    }
  }
}