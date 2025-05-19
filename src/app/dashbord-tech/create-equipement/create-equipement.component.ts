import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Laboratoire, PC, LaboratoireData, PCData } from 'src/app/models/gestion.model';
import { GestionService } from 'src/app/services/gestion.service';
@Component({
  selector: 'app-create-equipement',
  templateUrl: './create-equipement.component.html',
  styleUrls: ['./create-equipement.component.css']
})
export class CreateEquipementComponent {

 currentSection: 'reclamations' | 'equipment' = 'reclamations'; // Par défaut sur les réclamations
  isSidebarVisible = true;
  isLoadingLabos = false;
  isLoadingPCs = false;
  errorMessage: string | null = null;

  // --- Gestion des Laboratoires ---
  laboratoires: Laboratoire[] = [];
  selectedLaboratoire: Laboratoire | null = null;
  selectedLaboPCs: PC[] = []; // PCs du laboratoire sélectionné
  currentLaboratoire: Partial<Laboratoire> = this.createEmptyLabo(); // Pour le formulaire modal
  isEditingLabo: boolean = false;
  showLaboModal: boolean = false;
  showDeleteConfirm: boolean = false;
  laboratoireToDelete: Laboratoire | null = null;
  searchLaboTerm: string = '';

  // --- Gestion des PCs (Postes) ---
  showPosteModal: boolean = false;
  currentPC: Partial<PC> = this.createEmptyPoste(); // Pour le formulaire modal
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
    this.loadLaboratoires();
    // Chargez aussi les réclamations initiales si elles viennent d'un service
    // this.loadReclamations();
  }

  toggleSidebar(): void {
    this.isSidebarVisible = !this.isSidebarVisible;
  }

  showSection(section: 'reclamations' | 'equipment') {
    this.currentSection = section;
    this.resetEquipmentStates(); // Réinitialiser l'état de la section équipement
    if (section === 'equipment' && this.laboratoires.length === 0) {
       this.loadLaboratoires(); // Recharger si la liste est vide
    }
    // Réinitialiser aussi l'état des réclamations si nécessaire
    // this.resetReclamationStates();
  }

  // --- Méthodes Laboratoires ---

  loadLaboratoires(): void {
    this.isLoadingLabos = true;
    this.errorMessage = null;
    this.gestionService.getLaboratoires().subscribe({
      next: (data) => {
        this.laboratoires = data;
        this.isLoadingLabos = false;
      },
      error: (err: Error) => {
        this.errorMessage = `Erreur lors du chargement des laboratoires: ${err.message}`;
        this.isLoadingLabos = false;
        console.error(err);
      }
    });
  }

  openLaboDetails(labo: Laboratoire): void {
    if (this.selectedLaboratoire?.id === labo.id) {
        this.selectedLaboratoire = null; // Déselectionner si on clique sur le même
        this.selectedLaboPCs = [];
    } else {
        this.selectedLaboratoire = labo;
        this.loadPCsForLaboratoire(labo.id);
    }
  }

  loadPCsForLaboratoire(laboId: number): void {
    this.isLoadingPCs = true;
    this.errorMessage = null;
    this.selectedLaboPCs = []; // Vider la liste précédente
    this.gestionService.getPCsByLaboratoire(laboId).subscribe({
      next: (data) => {
        this.selectedLaboPCs = data;
        this.isLoadingPCs = false;
      },
      error: (err: Error) => {
        this.errorMessage = `Erreur lors du chargement des PCs pour le labo ${laboId}: ${err.message}`;
        this.isLoadingPCs = false;
        console.error(err);
      }
    });
  }

  openAddLaboModal(): void {
    this.isEditingLabo = false;
    this.currentLaboratoire = this.createEmptyLabo();
    this.showLaboModal = true;
  }

  editLabo(labo: Laboratoire): void {
    this.isEditingLabo = true;
    // Crée une copie pour éviter la modification directe avant sauvegarde
    this.currentLaboratoire = { ...labo };
    this.showLaboModal = true;
  }

  saveLabo(): void {
     this.errorMessage = null;
     const dataToSave: Partial<LaboratoireData> = {
        nom: this.currentLaboratoire.nom,
        modele_postes: this.currentLaboratoire.modele_postes,
        processeur: this.currentLaboratoire.processeur,
        memoire_ram: this.currentLaboratoire.memoire_ram,
        stockage: this.currentLaboratoire.stockage
     };

    // Validation simple (peut être améliorée)
    if (!dataToSave.nom) {
        this.errorMessage = "Le nom du laboratoire est requis.";
        return;
    }

    const operation = this.isEditingLabo
      ? this.gestionService.updateLaboratoire(this.currentLaboratoire.id!, dataToSave)
      : this.gestionService.createLaboratoire(dataToSave as LaboratoireData); // Cast car tous les champs sont présents

    operation.subscribe({
      next: (updatedOrCreatedLabo) => {
        this.cancelLaboEdit();
        this.loadLaboratoires(); // Recharger la liste
         // Optionnel : Sélectionner le labo modifié/créé
         // this.openLaboDetails(updatedOrCreatedLabo);
      },
      error: (err: Error) => {
        this.errorMessage = `Erreur lors de la sauvegarde du laboratoire: ${err.message}`;
        console.error(err);
         // Garder la modale ouverte en cas d'erreur pour correction
      }
    });
  }

  confirmDeleteLabo(labo: Laboratoire): void {
    this.laboratoireToDelete = labo;
    this.showDeleteConfirm = true;
  }

  deleteLabo(): void {
    if (!this.laboratoireToDelete) return;
     this.errorMessage = null;
    this.gestionService.deleteLaboratoire(this.laboratoireToDelete.id).subscribe({
      next: () => {
        this.showDeleteConfirm = false;
        if (this.selectedLaboratoire?.id === this.laboratoireToDelete?.id) {
          this.selectedLaboratoire = null;
          this.selectedLaboPCs = [];
        }
        this.laboratoireToDelete = null;
        this.loadLaboratoires(); // Recharger la liste
      },
      error: (err: Error) => {
         this.errorMessage = `Erreur lors de la suppression du laboratoire: ${err.message}`;
         console.error(err);
         this.showDeleteConfirm = false; // Fermer la modale d'erreur aussi
      }
    });
  }

  cancelLaboEdit(): void {
    this.showLaboModal = false;
    this.currentLaboratoire = this.createEmptyLabo();
    this.errorMessage = null; // Nettoyer les erreurs de la modale
  }

  createEmptyLabo(): Partial<Laboratoire> {
    return {
      nom: '',
      modele_postes: '',
      processeur: '',
      memoire_ram: '',
      stockage: ''
    };
  }

  get filteredLabos(): Laboratoire[] {
    if (!this.searchLaboTerm) return this.laboratoires;
    const term = this.searchLaboTerm.toLowerCase();
    return this.laboratoires.filter(labo =>
      labo.nom.toLowerCase().includes(term) ||
      (labo.modele_postes && labo.modele_postes.toLowerCase().includes(term)) ||
      (labo.processeur && labo.processeur.toLowerCase().includes(term))
    );
  }

  // Helper pour afficher la config du labo (optionnel, peut être fait dans le HTML)
  getLaboConfigItems(labo: Laboratoire) {
    return [
      { label: 'Modèle Postes', value: labo.modele_postes },
      { label: 'Processeur', value: labo.processeur },
      { label: 'Mémoire RAM', value: labo.memoire_ram },
      { label: 'Stockage', value: labo.stockage }
    ];
  }


  // --- Méthodes PCs (Postes) ---

  addNewPoste(): void {
    if (!this.selectedLaboratoire) return; // Ne rien faire si aucun labo n'est sélectionné
    this.isEditingPoste = false;
    this.currentPC = this.createEmptyPoste();
    this.currentPC.laboratoire = this.selectedLaboratoire.id; // Pré-remplir l'ID du labo parent
    this.showPosteModal = true;
  }

  editPoste(pc: PC): void {
    this.isEditingPoste = true;
    this.currentPC = { ...pc }; // Copie du PC à éditer
    // Pas besoin de conversion pour logiciels_installes car c'est une string
    this.showPosteModal = true;
  }

  savePoste(): void {
    this.errorMessage = null;
    if (!this.selectedLaboratoire) {
        this.errorMessage = "Aucun laboratoire sélectionné pour ajouter/modifier le poste.";
        return;
    }

    // Validation simple
    if (!this.currentPC.poste || !this.currentPC.sn_inventaire) {
        this.errorMessage = "Le nom du poste et le S/N Inventaire sont requis.";
        return;
    }

    const dataToSave: Partial<PCData> = {
        poste: this.currentPC.poste,
        sn_inventaire: this.currentPC.sn_inventaire,
        logiciels_installes: this.currentPC.logiciels_installes || '', // Assurer une string
        ecran: this.currentPC.ecran || '',
        laboratoire: this.currentPC.laboratoire // Doit être l'ID
    };


    const operation = this.isEditingPoste
      ? this.gestionService.updatePC(this.currentPC.id!, dataToSave) // Utiliser l'ID existant
      : this.gestionService.createPC(dataToSave as PCData); // Doit contenir data.laboratoire

    operation.subscribe({
      next: () => {
        this.cancelPosteEdit();
        // Recharger les PCs du laboratoire parent
        this.loadPCsForLaboratoire(this.selectedLaboratoire!.id);
      },
      error: (err: Error) => {
        this.errorMessage = `Erreur lors de la sauvegarde du poste: ${err.message}`;
        console.error(err);
        // Laisser la modale ouverte
      }
    });
  }

  confirmDeletePoste(pc: PC): void {
    this.pcToDelete = pc;
    this.showDeletePosteConfirm = true;
  }

  deletePoste(): void {
    if (!this.pcToDelete || !this.selectedLaboratoire) return;
    this.errorMessage = null;
    this.gestionService.deletePC(this.pcToDelete.id).subscribe({
      next: () => {
        this.showDeletePosteConfirm = false;
        this.pcToDelete = null;
        // Recharger les PCs du laboratoire parent
        this.loadPCsForLaboratoire(this.selectedLaboratoire!.id);
      },
      error: (err: Error) => {
        this.errorMessage = `Erreur lors de la suppression du poste: ${err.message}`;
        console.error(err);
        this.showDeletePosteConfirm = false;
      }
    });
  }

  cancelPosteEdit(): void {
    this.showPosteModal = false;
    this.currentPC = this.createEmptyPoste();
    this.errorMessage = null;
  }

  createEmptyPoste(): Partial<PC> {
    return {
      poste: '',
      sn_inventaire: '',
      logiciels_installes: '',
      ecran: '',
      laboratoire: undefined // Sera défini lors de l'ajout
    };
  }

  resetEquipmentStates(): void {
    // Ne pas réinitialiser la liste des laboratoires chargés
    this.selectedLaboratoire = null;
    this.selectedLaboPCs = [];
    this.showLaboModal = false;
    this.showPosteModal = false;
    this.showDeleteConfirm = false;
    this.showDeletePosteConfirm = false;
    this.laboratoireToDelete = null;
    this.pcToDelete = null;
    this.errorMessage = null;
    this.isLoadingPCs = false;
    // Ne pas réinitialiser isLoadingLabos ici, seulement au début du chargement
  }


  // --- Méthodes Réclamations (Exemples, à adapter avec votre service réel) ---

  toggleFilterDropdown() {
    this.isFilterDropdownVisible = !this.isFilterDropdownVisible;
  }

  openDetails(task: any) {
    this.selectedTask = task;
     this.showInterventionForm = false; // Fermer le form si ouvert
  }

  closeModal() { // Renommé pour plus de clarté (utilisé pour réclamation/intervention)
    this.selectedTask = null;
    this.showInterventionForm = false;
  }

  handleIntervention(task: any) {
    console.log("Intervention demandée pour :", task);
    this.selectedTask = task; // Assurer que la tâche est sélectionnée
    this.report = this.createEmptyReport(); // Initialiser un nouveau rapport
    this.showInterventionForm = true;
  }

   createEmptyReport() {
     return {
       dateIntervention: '',
       problem: this.selectedTask?.description || '', // Pré-remplir si possible
       analyse: '',
       actions: '',
       pieces: '',
       resultat: '',
       dateFin: '',
       recommandations: '',
       file: null
     };
   }




}