import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Laboratoire, PC, LaboratoireData, PCData } from '../models/gestion.model'; // Adaptez le chemin
import { GestionService } from '../services/gestion.service';
// Importez d'autres services si nécessaire (ex: pour les réclamations)

@Component({
  selector: 'app-dashbord-tech',
  templateUrl: './dashbord-tech.component.html',
  styleUrls: ['./dashbord-tech.component.css']
})
export class DashbordTechComponent implements OnInit {
  currentSection: 'reclamations' | 'equipment' = 'reclamations'; // Par défaut sur les réclamations
  isSidebarVisible = true;
  isLoadingLabos = false;
  isLoadingPCs = false;
  errorMessage: string | null = null;

  // --- Gestion des Laboratoires ---
  laboratoires: Laboratoire[] = [];
  selectedLaboratoire: Laboratoire | null = null;
  selectedLaboPCs: PC[] = []; // PCs du laboratoire sélectionné
  isEditingLabo: boolean = false;
  showLaboModal: boolean = false;
  showDeleteConfirm: boolean = false;
  laboratoireToDelete: Laboratoire | null = null;
  searchLaboTerm: string = '';

  // --- Gestion des PCs (Postes) ---
  showPosteModal: boolean = false;
  isEditingPoste: boolean = false;
  showDeletePosteConfirm = false;
  pcToDelete: PC | null = null;

  // --- Réclamations (à intégrer avec un service dédié si possible) ---
  tasks: any[] = [ /* ... Vos données de réclamations actuelles ou charger via service ... */ ];
  selectedTask: any = null; // Pour les détails de la réclamation
  isFilterDropdownVisible = false; // Pour le filtre des réclamations
  showInterventionForm: boolean = false; // Pour le formulaire d'intervention
  report = { /* ... Structure de votre rapport ... */ }; // Pour le rapport d'intervention

  constructor(
    private gestionService: GestionService
    // Injectez d'autres services (ReclamationService, InterventionService...)
  ) {}

  ngOnInit(): void {
    // Chargez aussi les réclamations initiales si elles viennent d'un service
    // this.loadReclamations();
  }

  toggleSidebar(): void {
    this.isSidebarVisible = !this.isSidebarVisible;
  }





}