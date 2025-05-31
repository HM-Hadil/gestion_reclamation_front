import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Intervention } from 'src/app/models/Intervention';
import { User } from 'src/app/models/User';
import { Reclamation } from 'src/app/models/reclamation.model';
import { InterventionService, StatsResponse } from 'src/app/services/intervention.service';
import { ReclamationService } from 'src/app/services/reclamation.service';
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

interface ReclamationStats {
  totalReclamations: number;
  byCategory: Statistic[];
  byStatus: Statistic[];
  byLieu: Statistic[];
  byLieuExact: Statistic[];
  byProblemType: Statistic[];
  recentTrends: {
    thisMonth: number;
    lastMonth: number;
    percentageChange: number;
  };
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
  isLoadingReclamations = false;
  statsErrorMessage: string | null = null;
  reclamationsErrorMessage: string | null = null;

  // Section active pour basculer entre interventions et réclamations
  currentSection: string = 'interventions'; // 'interventions' ou 'reclamations'

  // Données des statistiques d'interventions
  interventions: Intervention[] = [];
  totalInterventions: number = 0;
  technicianStats: Statistic[] = [];
  statusStats: Statistic[] = [];
  completionStats: Statistic[] = [];
  uniqueTechnicians: ExtendedUser[] = [];
  technicianDetails: { [key: number]: ExtendedUser } = {};

  // Données des statistiques de réclamations
  reclamationStats: ReclamationStats = {
    totalReclamations: 0,
    byCategory: [],
    byStatus: [],
    byLieu: [],
    byLieuExact: [],
    byProblemType: [],
    recentTrends: {
      thisMonth: 0,
      lastMonth: 0,
      percentageChange: 0
    }
  };

  private currentFilterTechnicianId: number | null = null;

  constructor(
    private interventionService: InterventionService,
    private reclamationService: ReclamationService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadInterventionStats();
    this.loadReclamationStats();
  }

  // --- Méthodes de navigation ---
  switchToSection(section: string): void {
    this.currentSection = section;
    if (section === 'interventions' && this.totalInterventions === 0) {
      this.loadInterventionStats();
    } else if (section === 'reclamations' && this.reclamationStats.totalReclamations === 0) {
      this.loadReclamationStats();
    }
  }

  // --- Chargement des données d'interventions (code existant) ---
  loadInterventionStats(): void {
    this.isLoadingStats = true;
    this.statsErrorMessage = null;

    this.interventionService.getInterventionStats(this.currentFilterTechnicianId).subscribe({
      next: (data: StatsResponse) => {
        this.totalInterventions = data.total_interventions;
        
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

  // --- Chargement des statistiques de réclamations ---
  loadReclamationStats(): void {
    this.isLoadingReclamations = true;
    this.reclamationsErrorMessage = null;

    this.reclamationService.AllfilterdReclamations().subscribe({
      next: (reclamations: Reclamation[]) => {
        this.processReclamationStats(reclamations);
        this.isLoadingReclamations = false;
      },
      error: (error: HttpErrorResponse) => {
        this.reclamationsErrorMessage = `Erreur lors de la récupération des réclamations: ${error.message}`;
        this.isLoadingReclamations = false;
        console.error('Erreur lors du chargement des réclamations:', error);
      }
    });
  }

  private processReclamationStats(reclamations: Reclamation[]): void {
    this.reclamationStats.totalReclamations = reclamations.length;

    // Statistiques par catégorie
    this.reclamationStats.byCategory = this.calculateCategoryStats(reclamations);
    
    // Statistiques par statut
    this.reclamationStats.byStatus = this.calculateStatusStatsReclamations(reclamations);
    
    // Statistiques par lieu
    this.reclamationStats.byLieu = this.calculateLieuStats(reclamations);
    
    // Statistiques par lieu exact
    this.reclamationStats.byLieuExact = this.calculateLieuExactStats(reclamations);
    
    // Statistiques par type de problème
    this.reclamationStats.byProblemType = this.calculateProblemTypeStats(reclamations);
    
    // Tendances récentes
    this.reclamationStats.recentTrends = this.calculateRecentTrends(reclamations);

    console.log('Statistiques de réclamations traitées:', this.reclamationStats);
  }

  private calculateCategoryStats(reclamations: Reclamation[]): Statistic[] {
    const categoryCount: { [key: string]: number } = {};
    
    reclamations.forEach(rec => {
      if (rec.category) {
        categoryCount[rec.category] = (categoryCount[rec.category] || 0) + 1;
      }
    });

    return Object.keys(categoryCount).map(category => ({
      name: this.getCategoryLabel(category),
      count: categoryCount[category],
      percentage: this.reclamationStats.totalReclamations > 0 ? 
        (categoryCount[category] / this.reclamationStats.totalReclamations) * 100 : 0
    })).sort((a, b) => b.count - a.count);
  }

  private calculateStatusStatsReclamations(reclamations: Reclamation[]): Statistic[] {
    const statusCount: { [key: string]: number } = {};
    
    reclamations.forEach(rec => {
      if (rec.status) {
        statusCount[rec.status] = (statusCount[rec.status] || 0) + 1;
      }
    });

    return Object.keys(statusCount).map(status => ({
      name: this.getStatusLabel(status),
      count: statusCount[status],
      percentage: this.reclamationStats.totalReclamations > 0 ? 
        (statusCount[status] / this.reclamationStats.totalReclamations) * 100 : 0
    })).sort((a, b) => b.count - a.count);
  }

  private calculateLieuStats(reclamations: Reclamation[]): Statistic[] {
    const lieuCount: { [key: string]: number } = {};
    
    reclamations.forEach(rec => {
      if (rec.lieu) {
        const lieu = rec.lieu.charAt(0).toUpperCase() + rec.lieu.slice(1);
        lieuCount[lieu] = (lieuCount[lieu] || 0) + 1;
      }
    });

    return Object.keys(lieuCount).map(lieu => ({
      name: lieu,
      count: lieuCount[lieu],
      percentage: this.reclamationStats.totalReclamations > 0 ? 
        (lieuCount[lieu] / this.reclamationStats.totalReclamations) * 100 : 0
    })).sort((a, b) => b.count - a.count);
  }

  private calculateLieuExactStats(reclamations: Reclamation[]): Statistic[] {
    const lieuExactCount: { [key: string]: number } = {};
    
    reclamations.forEach(rec => {
      if (rec.lieuExacte) {
        lieuExactCount[rec.lieuExacte] = (lieuExactCount[rec.lieuExacte] || 0) + 1;
      }
    });

    return Object.keys(lieuExactCount).map(lieuExact => ({
      name: lieuExact,
      count: lieuExactCount[lieuExact],
      percentage: this.reclamationStats.totalReclamations > 0 ? 
        (lieuExactCount[lieuExact] / this.reclamationStats.totalReclamations) * 100 : 0
    })).sort((a, b) => b.count - a.count).slice(0, 10); // Top 10 des lieux exacts
  }

  private calculateProblemTypeStats(reclamations: Reclamation[]): Statistic[] {
    const problemTypeCount: { [key: string]: number } = {};
    
    reclamations.forEach(rec => {
      let problemType = '';
      
      if (rec.category === 'pc' && rec.pc_details?.type_probleme) {
        problemType = `PC: ${rec.pc_details.type_probleme}`;
      } else if (rec.category === 'electrique' && rec.electrique_details?.type_probleme) {
        problemType = `Électrique: ${rec.electrique_details.type_probleme}`;
      } else if (rec.category === 'divers' && rec.divers_details?.type_probleme) {
        problemType = `Divers: ${rec.divers_details.type_probleme}`;
      }
      
      if (problemType) {
        problemTypeCount[problemType] = (problemTypeCount[problemType] || 0) + 1;
      }
    });

    return Object.keys(problemTypeCount).map(problemType => ({
      name: problemType,
      count: problemTypeCount[problemType],
      percentage: this.reclamationStats.totalReclamations > 0 ? 
        (problemTypeCount[problemType] / this.reclamationStats.totalReclamations) * 100 : 0
    })).sort((a, b) => b.count - a.count).slice(0, 15); // Top 15 des types de problèmes
  }

  private calculateRecentTrends(reclamations: Reclamation[]): any {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

    let thisMonthCount = 0;
    let lastMonthCount = 0;

    reclamations.forEach(rec => {
      const recDate = new Date(rec.date_creation);
      if (recDate >= thisMonth) {
        thisMonthCount++;
      } else if (recDate >= lastMonth && recDate < thisMonth) {
        lastMonthCount++;
      }
    });

    const percentageChange = lastMonthCount > 0 ? 
      ((thisMonthCount - lastMonthCount) / lastMonthCount) * 100 : 0;

    return {
      thisMonth: thisMonthCount,
      lastMonth: lastMonthCount,
      percentageChange: Math.round(percentageChange * 100) / 100
    };
  }

  // --- Méthodes utilitaires pour les réclamations ---
  private getCategoryLabel(category: string): string {
    const categoryLabels: { [key: string]: string } = {
      'pc': 'Problème informatique',
      'electrique': 'Problème électrique',
      'divers': 'Problème divers'
    };
    return categoryLabels[category] || category;
  }

  private getStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      'en_attente': 'En attente',
      'en_cours': 'En cours',
      'termine': 'Terminé'
    };
    return statusLabels[status] || status;
  }

  getReclamationColorClass(index: number): string {
    const colors = ['bg-blue-600', 'bg-green-600', 'bg-purple-600', 'bg-indigo-600', 
                   'bg-pink-600', 'bg-yellow-600', 'bg-red-600', 'bg-teal-600'];
    return colors[index % colors.length];
  }

  getReclamationStatusColorClass(status: string): string {
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus.includes('attente')) return 'bg-yellow-500';
    if (normalizedStatus.includes('cours')) return 'bg-blue-500';
    if (normalizedStatus.includes('terminé')) return 'bg-green-500';
    return 'bg-gray-500';
  }

  // --- Code existant pour les interventions (inchangé) ---
  private async loadTechnicianDetails(data: StatsResponse): Promise<void> {
    this.isLoadingUserDetails = true;
    
    const technicianIds = Array.from(new Set([
      ...data.technicians_data.map(t => t.id),
      ...Object.keys(data.technician_distribution).map(id => parseInt(id))
    ]));

    this.technicianDetails = {}; 
    this.uniqueTechnicians = [];

    const userDetailRequests = technicianIds.map(id => 
      this.authService.getUserById(id).pipe(        
        catchError(error => {
          console.warn(`Impossible de récupérer les détails de l'utilisateur ${id}. Utilisation des valeurs par défaut.`, error);
          return of({
            id: id,
            first_name: '',
            last_name: '',
            email: `technicien_${id}@example.com`,
            password: '',
            role: 'technicien' as const
          });
        })
      )
    );

    try {
      const userDetails = await forkJoin(userDetailRequests).toPromise();
      
      userDetails?.forEach(user => {
        const firstName = (typeof user.first_name === 'string' ? user.first_name : '').trim();
        const lastName = (typeof user.last_name === 'string' ? user.last_name : '').trim();
        const fullName = `${firstName} ${lastName}`.trim();
        
        this.technicianDetails[user.id] = {
          ...user,
          fullName: fullName || `Utilisateur #${user.id}`
        };
      });

      this.uniqueTechnicians = Object.values(this.technicianDetails)
        .sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));

    } catch (error) {
      console.error('Erreur irrécupérable lors du chargement des détails utilisateur:', error);
    } finally {
      this.isLoadingUserDetails = false;
    }
  }

  private processStatsData(data: StatsResponse): void {
    this.technicianStats = Object.keys(data.technician_distribution).map(techId => {
      const technicianId = parseInt(techId);
      const technicianDetail = this.technicianDetails[technicianId];
      
      let name: string;
      if (technicianDetail?.fullName) {
        name = technicianDetail.fullName;
      } else {
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
      
      return { name, count, percentage };
    }).sort((a, b) => b.count - a.count);

    this.statusStats = Object.keys(data.status_distribution).map(statusKey => {
      const count = data.status_distribution[statusKey];
      const percentage = this.totalInterventions > 0 ? (count / this.totalInterventions) * 100 : 0;
      return { name: statusKey, count, percentage };
    }).sort((a, b) => b.count - a.count);

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
    }
  }

  // --- Interactions UI ---
  toggleTechnicianFilterDropdown(): void {
    this.isTechnicianFilterDropdownVisible = !this.isTechnicianFilterDropdownVisible;
  }

  filterByTechnician(technicianId: number | null): void {
    this.currentFilterTechnicianId = technicianId;
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

  getTechnicianFullName(technicianId: number): string {
    const detail = this.technicianDetails[technicianId];
    return detail?.fullName && detail.fullName.trim() !== '' ? detail.fullName : `Technicien #${technicianId}`;
  }

  getCurrentFilterTechnicianName(): string {
    if (this.currentFilterTechnicianId === null) {
      return 'Tous les techniciens';
    }
    return this.getTechnicianFullName(this.currentFilterTechnicianId);
  }

  get isLoading(): boolean {
    return this.isLoadingStats || this.isLoadingUserDetails || this.isLoadingReclamations;
  }
}