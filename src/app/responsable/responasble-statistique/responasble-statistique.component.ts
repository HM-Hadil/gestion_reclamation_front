import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Intervention } from 'src/app/models/Intervention';
import { User } from 'src/app/models/User';
import { InterventionService, StatsResponse } from 'src/app/services/intervention.service';
import { AuthService } from 'src/app/auth.service';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

interface Statistic {
  name: string;
  count: number;
  percentage: number;
}

interface ExtendedUser extends User {
  fullName?: string;
}

@Component({
  selector: 'app-responasble-statistique',
  templateUrl: './responasble-statistique.component.html',
  styleUrls: ['./responasble-statistique.component.css']
})
export class ResponasbleStatistiqueComponent implements OnInit {
  // Variables d'état pour l'UI
  isTechnicianFilterDropdownVisible = false;
  isLoadingStats = false;
  isLoadingUserDetails = false;
  statsErrorMessage: string | null = null;

  // Données des statistiques
  interventions: Intervention[] = [];
  totalInterventions: number = 0;
  technicianStats: Statistic[] = [];
  statusStats: Statistic[] = [];
  completionStats: Statistic[] = [];
  uniqueTechnicians: ExtendedUser[] = []; // Étendu pour inclure fullName
  technicianDetails: { [key: number]: ExtendedUser } = {}; // Cache des détails utilisateur

  private currentFilterTechnicianId: number | null = null;

  constructor(
    private interventionService: InterventionService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadInterventionStats();
  }

  // --- Chargement des données ---
  loadInterventionStats(): void {
    this.isLoadingStats = true;
    this.statsErrorMessage = null;

    this.interventionService.getInterventionStats(this.currentFilterTechnicianId).subscribe({
      next: (data: StatsResponse) => {
        this.totalInterventions = data.total_interventions;
        // Don't directly assign data.technicians_data here,
        // it will be populated with full names after user details are loaded.
        
        // Charger les détails des techniciens
        this.loadTechnicianDetails(data).then(() => {
          this.processStatsData(data);
          this.isLoadingStats = false;
        });
      },
      error: (error: HttpErrorResponse) => {
        this.statsErrorMessage = `Erreur lors de la récupération des statistiques: ${error.message}`;
        this.isLoadingStats = false;
        console.error('Erreur lors du chargement des stats:', error);
      }
    });
  }

  private async loadTechnicianDetails(data: StatsResponse): Promise<void> {
    this.isLoadingUserDetails = true;
    
    // Extraire tous les IDs de techniciens uniques de toutes les sources
    const technicianIds = Array.from(new Set([
      ...data.technicians_data.map(t => t.id),
      ...Object.keys(data.technician_distribution).map(id => parseInt(id))
    ]));

    // Clear existing technicianDetails cache and uniqueTechnicians list
    this.technicianDetails = {}; 
    this.uniqueTechnicians = [];

    // Créer des observables pour récupérer les détails de chaque technicien
    const userDetailRequests = technicianIds.map(id => 
      this.authService.getUserById(id).pipe(        
        catchError(error => {
          console.warn(`Impossible de récupérer les détails de l'utilisateur ${id}. Utilisation des valeurs par défaut.`, error);
          // Retourner un objet par défaut avec des valeurs vides pour un traitement plus propre
          return of({
            id: id,
            first_name: '', // Initialiser à une chaîne vide
            last_name: '',  // Initialiser à une chaîne vide
            email: `technicien_${id}@example.com`,
            password: '',
            role: 'technicien' as const // Ensure role is correctly typed
          });
        })
      )
    );

    try {
      // Exécuter toutes les requêtes en parallèle
      const userDetails = await forkJoin(userDetailRequests).toPromise();
      
      // Traiter les résultats et créer le cache
      userDetails?.forEach(user => {
        // S'assurer que first_name et last_name sont des chaînes de caractères
        const firstName = (typeof user.first_name === 'string' ? user.first_name : '').trim();
        const lastName = (typeof user.last_name === 'string' ? user.last_name : '').trim();
        const fullName = `${firstName} ${lastName}`.trim();
        
        this.technicianDetails[user.id] = {
          ...user,
          // Utiliser le nom complet ou un fallback générique si le nom complet est vide
          fullName: fullName || `Utilisateur #${user.id}`
        };
        console.log(`Détails du technicien en cache pour ID ${user.id}:`, this.technicianDetails[user.id]);
      });

      // Populate uniqueTechnicians directly from the populated technicianDetails cache
      // This ensures all technicians in the dropdown have the resolved fullName.
      this.uniqueTechnicians = Object.values(this.technicianDetails)
        .sort((a, b) => (a.fullName || '').localeCompare(b.fullName || '')); // Optional: sort by name
      
      console.log('Liste des techniciens uniques mise à jour avec noms complets (pour le filtre):', this.uniqueTechnicians);

    } catch (error) {
      console.error('Erreur irrécupérable lors du chargement des détails utilisateur:', error);
    } finally {
      this.isLoadingUserDetails = false;
    }
  }

  private processStatsData(data: StatsResponse): void {
    // Traitement de la distribution par technicien avec noms complets
    this.technicianStats = Object.keys(data.technician_distribution).map(techId => {
      const technicianId = parseInt(techId);
      const technicianDetail = this.technicianDetails[technicianId];
      
      let name: string;
      if (technicianDetail?.fullName) {
        name = technicianDetail.fullName;
      } else {
        // Fallback sur les données originales si le détail n'est pas en cache
        const technician = data.technicians_data.find(t => t.id === technicianId);
        if (technician) {
          const firstName = (typeof technician.first_name === 'string' ? technician.first_name : '').trim();
          const lastName = (typeof technician.last_name === 'string' ? technician.last_name : '').trim();
          const fullName = `${firstName} ${lastName}`.trim();
          name = fullName || `Technicien #${techId}`;
        } else {
          name = `Technicien #${techId}`;
        }
      }

      const count = data.technician_distribution[techId];
      const percentage = this.totalInterventions > 0 ? (count / this.totalInterventions) * 100 : 0;
      
      console.log(`Stat pour technicien ID ${techId}: Nom='${name}', Compte=${count}, Pourcentage=${percentage.toFixed(2)}%`);
      return { name, count, percentage };
    }).sort((a, b) => b.count - a.count);
    console.log('Statistiques des techniciens traitées:', this.technicianStats);

    // Traitement de la distribution par statut (inchangé)
    this.statusStats = Object.keys(data.status_distribution).map(statusKey => {
      const count = data.status_distribution[statusKey];
      const percentage = this.totalInterventions > 0 ? (count / this.totalInterventions) * 100 : 0;
      console.log(`Statut ${statusKey}: Compte=${count}, Pourcentage=${percentage.toFixed(2)}%`);
      return { name: statusKey, count, percentage };
    }).sort((a, b) => b.count - a.count);
    console.log('Statistiques des statuts traitées:', this.statusStats);


    // Traitement des statistiques de complétion (inchangé)
    if (data.status_summary) {
      this.completionStats = [
        {
          name: 'Terminées',
          count: data.status_summary.completed,
          percentage: this.totalInterventions > 0 ? (data.status_summary.completed / this.totalInterventions) * 100 : 0
        },
        {
          name: 'Non terminées',
          count: data.status_summary.non_completed,
          percentage: this.totalInterventions > 0 ? (data.status_summary.non_completed / this.totalInterventions) * 100 : 0
        }
      ];
      console.log('Statistiques de complétion traitées:', this.completionStats);
    }
  }

  // --- Interactions UI ---
  toggleTechnicianFilterDropdown(): void {
    this.isTechnicianFilterDropdownVisible = !this.isTechnicianFilterDropdownVisible;
    console.log('Visibilité du filtre technicien:', this.isTechnicianFilterDropdownVisible);
  }

  filterByTechnician(technicianId: number | null): void {
    this.currentFilterTechnicianId = technicianId;
    console.log('Filtre par technicien appliqué:', technicianId === null ? 'Tous' : this.getTechnicianFullName(technicianId));
    this.loadInterventionStats();
    this.toggleTechnicianFilterDropdown();
  }

  // --- Méthodes auxiliaires pour l'affichage ---
  getTechnicianColorClass(technicianName: string): string {
    const colors = ['bg-blue-600', 'bg-green-600', 'bg-purple-600', 'bg-indigo-600', 'bg-pink-600'];
    let hash = 0;
    for (let i = 0; i < technicianName.length; i++) {
      hash = technicianName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash % colors.length);
    return colors[index];
  }

  getStatutColorClass(status: string): string {
    switch (status) {
      case 'termine': return 'bg-green-500';
      case 'en_cours': return 'bg-blue-500';
      case 'en_attente': return 'bg-yellow-500';
      case 'Terminées': return 'bg-green-500';
      case 'Non terminées': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  }

  formatStatut(status: string): string {
    switch (status) {
      case 'en_attente': return 'En attente';
      case 'en_cours': return 'En cours';
      case 'termine': return 'Terminé';
      default: return status;
    }
  }

  // --- Nouvelles méthodes utilitaires ---
  getTechnicianFullName(technicianId: number): string {
    const detail = this.technicianDetails[technicianId];
    // S'assurer que le nom complet est bien une chaîne non vide
    return detail?.fullName && detail.fullName.trim() !== '' ? detail.fullName : `Technicien #${technicianId}`;
  }

  getCurrentFilterTechnicianName(): string {
    if (this.currentFilterTechnicianId === null) {
      return 'Tous les techniciens';
    }
    return this.getTechnicianFullName(this.currentFilterTechnicianId);
  }

  // Méthode pour vérifier si les données sont en cours de chargement
  get isLoading(): boolean {
    return this.isLoadingStats || this.isLoadingUserDetails;
  }
}