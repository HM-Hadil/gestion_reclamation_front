import { Component } from '@angular/core';

@Component({
  selector: 'app-responsable',
  templateUrl: './responsable.component.html',
  styleUrls: ['./responsable.component.css']
})
export class ResponsableComponent {
  // Variables d'état
  isFilterDropdownVisible = false;
  activeTab: string = 'interventions';
  isSidebarVisible = true;
  selectedTask: any = null;
  keywords: string = '';
  showInterventionStats = false;
  showReclamationStats = false;

  // Liste des interventions (à remplacer par des données réelles)
  interventions = [
    { id: 1, title: 'Intervention 1', date: '2025-02-20', status: 'Terminé', technicien: 'Anwar' },
    { id: 2, title: 'Intervention 2', date: '2025-02-21', status: 'En attente', technicien: 'Ali' },
    { id: 3, title: 'Intervention 3', date: '2025-02-22', status: 'Terminé', technicien: 'Anwar' },
    { id: 4, title: 'Intervention 4', date: '2025-02-23', status: 'En attente', technicien: 'Ali' },
  ];

  // Liste des réclamations (à remplacer par des données réelles)
  reclamations = [
    { id: 1, title: 'Réclamation 1', statusResolved: true, type: 'Matériel', lieu: 'Laboratoire' },
    { id: 2, title: 'Réclamation 2', statusResolved: false, type: 'Logiciel', lieu: 'Salle' },
    { id: 3, title: 'Réclamation 3', statusResolved: false, type: 'Électrique', lieu: 'Bureau' },
    { id: 4, title: 'Réclamation 4', statusResolved: true, type: 'Divers', lieu: 'Laboratoire' },
  ];

  // Fonction pour changer l'onglet actif
  setActiveTab(tab: string) {
    this.activeTab = tab;
    this.showInterventionStats = false;
    this.showReclamationStats = false;
  }

  // Fonction pour afficher/masquer le filtre
  toggleFilterDropdown() {
    this.isFilterDropdownVisible = !this.isFilterDropdownVisible;
  }

  // Fonction pour afficher/masquer les stats interventions
  toggleInterventionStats() {
    this.showInterventionStats = !this.showInterventionStats;
  }

  // Fonction pour afficher/masquer les stats réclamations
  toggleReclamationStats() {
    this.showReclamationStats = !this.showReclamationStats;
  }

  // Variables de la modale
  modalVisible: boolean = false;
  modalData: any = null;
  modalType: string | null = null;

  // Fonction pour ouvrir les détails dans la modale
  openDetails(data: any, type: string) {
    this.modalData = data;
    this.modalType = type;
    this.modalVisible = true;
  }

  // Fonction pour fermer la modale
  closeModal() {
    this.modalVisible = false;
    this.modalData = null;
    this.modalType = null;
  }

  toggleSidebar(): void {
    this.isSidebarVisible = !this.isSidebarVisible;
  }

  // Statistiques pour les interventions
  countByTechnician(technicien: string): number {
    return this.interventions.filter(i => i.technicien === technicien).length;
  }

  getTechnicianPercentage(technicien: string): number {
    const count = this.countByTechnician(technicien);
    return Math.round((count / this.interventions.length) * 100);
  }

  countByStatus(status: string): number {
    return this.interventions.filter(i => i.status === status).length;
  }

  getStatusPercentage(status: string): number {
    const count = this.countByStatus(status);
    return Math.round((count / this.interventions.length) * 100);
  }

  // Statistiques pour les réclamations
  countByProblemType(type: string): number {
    return this.reclamations.filter(r => r.type === type).length;
  }

  getProblemTypePercentage(type: string): number {
    const count = this.countByProblemType(type);
    return Math.round((count / this.reclamations.length) * 100);
  }

  countByLocation(lieu: string): number {
    return this.reclamations.filter(r => r.lieu === lieu).length;
  }

  getLocationPercentage(lieu: string): number {
    const count = this.countByLocation(lieu);
    return Math.round((count / this.reclamations.length) * 100);
  }
}