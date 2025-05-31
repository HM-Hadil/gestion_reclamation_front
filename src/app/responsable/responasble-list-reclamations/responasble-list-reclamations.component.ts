import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { AuthService } from 'src/app/auth.service';
import { Reclamation } from 'src/app/models/reclamation.model';
import { ReclamationService } from 'src/app/services/reclamation.service';

@Component({
  selector: 'app-responasble-list-reclamations',
  templateUrl: './responasble-list-reclamations.component.html',
  styleUrls: ['./responasble-list-reclamations.component.css']
})
export class ResponasbleListReclamationsComponent {
 // Variables d'état
  isFilterDropdownVisible = false;
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  searchTerm: string = '';

  // Variables pour les données
  reclamations: Reclamation[] = [];
  filteredReclamations: Reclamation[] = [];
  
  // Variable pour la modal
  modalVisible: boolean = false;
  modalData: Reclamation | null = null;
  
  // Cache pour les utilisateurs
  usersCache: { [key: number]: any } = {};

  constructor(
    private reclamationService: ReclamationService,
    private userService: AuthService // Injection du service utilisateur
  ) {}

  ngOnInit(): void {
    this.loadReclamations();
  }

  loadReclamations(): void {
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

  // Charger les informations des utilisateurs
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

  // Obtenir le nom de l'utilisateur
  getUserName(userId: number): string {
    const user = this.usersCache[userId];
    if (user) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || `Utilisateur ${userId}`;
    }
    return `Utilisateur ${userId}`;
  }

  // Obtenir le nom du poste PC si applicable
  getPcPosteName(reclamation: Reclamation): string {
    // Vérifier si c'est dans un labo ET si c'est une réclamation PC
    if (reclamation.lieu === 'labo' && reclamation.category === 'pc' && reclamation.pc_info?.poste) {
      return reclamation.pc_info.poste;
    }
    return '';
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
        (reclamation.category && reclamation.category.toLowerCase().includes(lowerSearchTerm)) ||
        (this.getUserName(reclamation.user).toLowerCase().includes(lowerSearchTerm))
      );
    }
  }

  // Gestion du filtre dropdown
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

  // Gestion de la modale
  openDetails(reclamation: Reclamation): void {
    this.modalData = reclamation;
    this.modalVisible = true;
  }

  closeModal(): void {
    this.modalVisible = false;
    this.modalData = null;
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

  // Obtenir la classe CSS de priorité
  getPrioriteClass(priorite: string): string {
    switch(priorite) {
      case 'Haute': return 'bg-red-100 text-red-800';
      case 'Moyenne': return 'bg-amber-100 text-amber-800';
      case 'Basse': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  // Obtenir la classe CSS de statut
  getStatutClass(statut: string): string {
    switch(statut) {
      case 'en_attente': return 'bg-red-100 text-red-800';
      case 'en_cours': return 'bg-blue-100 text-blue-800';
      case 'termine': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  // Formater le statut pour l'affichage
  formatStatut(statut: string): string {
    switch(statut) {
      case 'en_attente': return 'En attente';
      case 'en_cours': return 'En cours';
      case 'termine': return 'Terminé';
      default: return statut;
    }
  }
}