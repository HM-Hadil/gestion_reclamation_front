import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { Intervention } from 'src/app/models/Intervention';
import { User } from 'src/app/models/User';
import { InterventionService, StatsResponse } from 'src/app/services/intervention.service';
interface Statistic {
  name: string;
  count: number;
  percentage: number;
}

@Component({
  selector: 'app-responasble-statistique',
  templateUrl: './responasble-statistique.component.html',
  styleUrls: ['./responasble-statistique.component.css']
})
export class ResponasbleStatistiqueComponent {
  // Variables d'état pour l'UI
  isTechnicianFilterDropdownVisible = false;
  isLoadingStats = false;
  statsErrorMessage: string | null = null;

  // Données des statistiques
  interventions: Intervention[] = [];
  totalInterventions: number = 0;
  technicianStats: Statistic[] = [];
  statusStats: Statistic[] = [];
  uniqueTechnicians: User[] = []; // To populate the filter dropdown

  private currentFilterTechnicianId: number | null = null; // Store the currently applied filter

  constructor(private interventionService: InterventionService) { }

  ngOnInit(): void {
    this.loadInterventionStats();
  }

  // --- Data Loading ---
  loadInterventionStats(): void {
    this.isLoadingStats = true;
    this.statsErrorMessage = null;

    this.interventionService.getInterventionStats(this.currentFilterTechnicianId).subscribe({
      next: (data: StatsResponse) => {
        this.totalInterventions = data.total_interventions;
        this.processStatsData(data);
        this.uniqueTechnicians = data.technicians_data; // Populate unique technicians for dropdown
        this.isLoadingStats = false;
      },
      error: (error: HttpErrorResponse) => {
        this.statsErrorMessage = `Erreur lors de la récupération des statistiques: ${error.message}`;
        this.isLoadingStats = false;
        console.error(error);
      }
    });
  }

  private processStatsData(data: StatsResponse): void {
    // Process technician distribution
    this.technicianStats = Object.keys(data.technician_distribution).map(techId => {
      const technician = data.technicians_data.find(t => t.id === parseInt(techId));
      const name = technician ? `${technician.first_name} ${technician.last_name}` : `Technicien #${techId}`;
      const count = data.technician_distribution[techId];
      const percentage = this.totalInterventions > 0 ? (count / this.totalInterventions) * 100 : 0;
      return { name, count, percentage };
    }).sort((a, b) => b.count - a.count); // Sort by count descending

    // Process status distribution
    this.statusStats = Object.keys(data.status_distribution).map(statusKey => {
      const count = data.status_distribution[statusKey];
      const percentage = this.totalInterventions > 0 ? (count / this.totalInterventions) * 100 : 0;
      return { name: statusKey, count, percentage };
    }).sort((a, b) => b.count - a.count); // Sort by count descending
  }

  // --- UI Interactions ---
  toggleTechnicianFilterDropdown(): void {
    this.isTechnicianFilterDropdownVisible = !this.isTechnicianFilterDropdownVisible;
  }

  filterByTechnician(technicianId: number | null): void {
    this.currentFilterTechnicianId = technicianId;
    this.loadInterventionStats(); // Reload stats with the new filter
    this.toggleTechnicianFilterDropdown(); // Close dropdown
  }

  // --- Helper Methods for Display ---
  getTechnicianColorClass(technicianName: string): string {
    // You can define a mapping for technician names to colors for visual distinction
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
}


