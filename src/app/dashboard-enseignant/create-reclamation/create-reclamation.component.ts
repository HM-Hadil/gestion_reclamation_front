import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { AuthService } from '../../auth.service';
import { UserProfile } from '../../models/UserProfile';
import { Laboratoire, PC } from '../../models/gestion.model';
import { Subscription } from 'rxjs';
import { GestionService } from '../../services/gestion.service';
import { CreateReclamationRequest } from '../../models/reclamation.model';
import { ReclamationService } from '../../services/reclamation.service';
import { NgForm } from '@angular/forms';

interface Salle { id: number; nom: string;}
interface Bureau { id: number; nom: string;}

// Mise à jour de l'interface PC Details avec laboId
export interface ReclamationPCDetails {
  id?: number;
  reclamation?: number;
  laboId?: number;
  type_probleme: 'materiel' | 'logiciel';
  description_probleme: string | null;
}

@Component({
  selector: 'app-create-reclamation',
  templateUrl: './create-reclamation.component.html',
  styleUrls: ['./create-reclamation.component.css']
})
export class CreateReclamationComponent implements OnInit, OnDestroy {
  laboratoires: Laboratoire[] = [];
  filteredLabos: Laboratoire[] = [];
  selectedLabo: Laboratoire | null = null;

  userId!: number;
  isLoading = false;
  errorMessage: string | null = null;

  /** Reclamation properties */
  selectedLocation: 'Labo' | 'Salle' | 'Bureau' | null = null;
  salles: Salle[] = [];
  bureaux: Bureau[] = [];
  selectedLocationId: number | null = null;
  isLoadingLocations = false;

  selectedCategoryKey: 'PC' | 'Electrique' | 'Divers' | null = null;
  backendCategory: 'pc' | 'electrique' | 'divers' | null = null;

  pcs: PC[] = [];
  selectedPCId: number | null = null;
  isLoadingPCs = false;
  pcLoadingError: string | null = null; // Pour capturer spécifiquement les erreurs de chargement des PCs

  selectedProblemTypeKey: 'Matériel' | 'Logiciel' | null = null;
  backendProblemType: 'materiel' | 'logiciel' | null = null;

  // Options pour l'interface utilisateur
  materielProblems: string[] = ['Clavier', 'Souris', 'Écran', 'Unité centrale', 'Port USB', 'Autre Matériel'];
  logicielProblems: string[] = ['Système d\'exploitation', 'Logiciel spécifique', 'Connexion réseau', 'Virus/Malware', 'Autre Logiciel'];
  electriqueProblems: string[] = ['Climatiseur', 'Coupure générale', 'Prise électrique', 'Éclairage', 'Autre Problème Électrique'];
  diversProblems: string[] = ['Tableau blanc', 'Vidéo projecteur', 'Chaise/Table', 'Fenêtre/Porte', 'Autre Problème Divers'];

  // Mappages vers les clés du backend pour type_probleme
  private electriqueProblemMap: { [key: string]: 'climatiseur' | 'coupure_courant' | 'autre' } = {
    'Climatiseur': 'climatiseur',
    'Coupure générale': 'coupure_courant',
    'Prise électrique': 'autre',
    'Éclairage': 'autre',
    'Autre Problème Électrique': 'autre'
  };

  private diversProblemMap: { [key: string]: 'tableau_blanc' | 'video_projecteur' | 'autre' } = {
    'Tableau blanc': 'tableau_blanc',
    'Vidéo projecteur': 'video_projecteur',
    'Chaise/Table': 'autre',
    'Fenêtre/Porte': 'autre',
    'Autre Problème Divers': 'autre'
  };


  selectedProblem: string | null = null;
  showAddProblemInput = false;
  newProblem = '';

  climatiseurOptions: string[] = ["En panne", "Dysfonctionnement partiel", "Absent"];
  selectedClimatiseurOption: string | null = null;

  projectorStateOptions: string[] = ['En panne', 'Dysfonctionnel', 'Absent'];
  selectedProjectorState: string | null = null;

  problemDescription = '';

  isSubmitting = false;
  submitSuccess: boolean | null = null;
  submitError: string | null = null;

  private subscriptions: Subscription[] = [];
  private jwtHelper = new JwtHelperService();
  user: UserProfile = {
    id: null,
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    image: null
  };
  error = '';

  constructor(
    private gestionService: GestionService,
    private authService: AuthService,
    private reclamationService: ReclamationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.extractUserIdFromToken();
    this.resetForm();
    this.loadLaboratoires();
    this.loadSalles();
    this.loadBureaux();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  extractUserIdFromToken(): void {
    const token = localStorage.getItem('token');
    if (!token) {
      this.error = 'Vous devez être connecté.';
      this.router.navigate(['/login']);
      return;
    }

    try {
      const decoded = this.jwtHelper.decodeToken(token);
      const userId = decoded?.user_id || decoded?.id || decoded?.sub;

      if (userId) {
        this.userId = +userId;
        this.user.id = this.userId;
        this.fetchUserData(this.userId);
      } else {
        this.error = 'ID utilisateur introuvable dans le token.';
        this.authService.logout();
        this.router.navigate(['/login']);
      }
    } catch (err) {
      console.error('Erreur token:', err);
      this.error = 'Token invalide.';
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }

  fetchUserData(userId: number): void {
    this.authService.getUserById(userId).subscribe({
      next: (data: any) => {
        this.user = {
          id: userId,
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          email: data.email || '',
          role: data.role || '',
          image: data.image || null
        };
      },
      error: (err) => {
        console.error('Erreur récupération utilisateur:', err);
        this.error = `Erreur lors de la récupération des données utilisateur (${err.status}): ${err.error?.message || 'Erreur inconnue'}`;
        if (err.status === 401) {
          this.authService.logout();
          this.router.navigate(['/login']);
        }
      }
    });
  }

  loadLaboratoires(): void {
    this.isLoading = true;
    this.errorMessage = null;
    const laboSub = this.gestionService.getLaboratoires().subscribe({
      next: (data) => {
        this.laboratoires = data;
        this.filteredLabos = [...this.laboratoires];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des laboratoires', error);
        this.errorMessage = `Erreur: ${error.message || 'Impossible de charger les laboratoires.'}`;
        this.isLoading = false;
      }
    });
    this.subscriptions.push(laboSub);
  }

  // Ajout des méthodes pour charger les salles et les bureaux
  loadSalles(): void {
    this.isLoadingLocations = true;
    const sallesSub = this.gestionService.getSalles().subscribe({
      next: (data) => {
        this.salles = data;
        this.isLoadingLocations = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des salles', error);
        this.errorMessage = `Erreur: ${error.message || 'Impossible de charger les salles.'}`;
        this.isLoadingLocations = false;
      }
    });
    this.subscriptions.push(sallesSub);
  }

  loadBureaux(): void {
    this.isLoadingLocations = true;
    const bureauSub = this.gestionService.getBureaux().subscribe({
      next: (data) => {
        this.bureaux = data;
        this.isLoadingLocations = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des bureaux', error);
        this.errorMessage = `Erreur: ${error.message || 'Impossible de charger les bureaux.'}`;
        this.isLoadingLocations = false;
      }
    });
    this.subscriptions.push(bureauSub);
  }

  onPCSelect(pcId: number | null): void {
    console.log('PC sélectionné (radio), ID:', pcId);
    this.selectedPCId = pcId;
    this.resetStep('pcSpecific');
  }

  loadPCs(laboratoireId: number): void {
    this.isLoadingPCs = true;
    this.pcLoadingError = null;
    this.pcs = [];
    this.selectedPCId = null;
    console.log(`Chargement des PCs pour le laboratoire ID: ${laboratoireId}`);

    const pcSub = this.gestionService.getPCsByLaboratoire(laboratoireId).subscribe({
      next: (data: any) => {
        console.log('Données des PCs reçues:', data);
        // Assurer que data est traité comme un tableau
        if (Array.isArray(data)) {
          this.pcs = data;
        } else if (data && typeof data === 'object') {
          // Si c'est un objet avec des PCs à l'intérieur, essayez de l'extraire
          // Adapter selon la structure exacte de votre API
          this.pcs = Array.isArray(data.pcs) ? data.pcs : Object.values(data);
        } else {
          this.pcs = [];
          this.pcLoadingError = 'Format de données incorrect retourné par le serveur';
        }
      },
      error: err => {
        console.error(`Erreur lors du chargement des PCs pour le labo ${laboratoireId}:`, err);
        this.pcLoadingError = `Erreur: ${err.message || 'Impossible de charger les PCs.'}`;
      },
      complete: () => {
        this.isLoadingPCs = false;
        console.log('État final de this.pcs:', this.pcs);
      }
    });
    this.subscriptions.push(pcSub);
  }

  onLocationChange(locationType: 'Labo' | 'Salle' | 'Bureau'): void {
    this.selectedLocation = locationType;
    this.selectedLocationId = null;
    this.pcs = [];
    this.selectedPCId = null;
    this.resetStep('location');
    
    // Réinitialiser la catégorie en fonction du type de lieu
    this.selectedCategoryKey = null;
    this.backendCategory = null;
  }

  onLocationSelect(locationId: any): void {
    // Assurer que locationId est un nombre
    this.selectedLocationId = typeof locationId === 'number' ? locationId : 
                            (locationId ? +locationId : null);
    
    this.resetStep('category');

    if (this.selectedLocation === 'Labo' && this.selectedLocationId !== null) {
      this.loadPCs(this.selectedLocationId);
    } else {
      this.pcs = [];
      this.selectedPCId = null;
      this.isLoadingPCs = false;
    }
  }

  onCategoryChange(categoryKey: 'PC' | 'Electrique' | 'Divers'): void {
    this.selectedCategoryKey = categoryKey;
    switch (categoryKey) {
      case 'PC': this.backendCategory = 'pc'; break;
      case 'Electrique': this.backendCategory = 'electrique'; break;
      case 'Divers': this.backendCategory = 'divers'; break;
      default: this.backendCategory = null;
    }
    this.resetStep('categorySpecific');
  }

  onProblemTypeChange(typeKey: 'Matériel' | 'Logiciel'): void {
    this.selectedProblemTypeKey = typeKey;
    switch (typeKey) {
      case 'Matériel': this.backendProblemType = 'materiel'; break;
      case 'Logiciel': this.backendProblemType = 'logiciel'; break;
      default: this.backendProblemType = null;
    }
    this.resetStep('problemTypeSpecific');
  }

  onSelectProblem(problem: string): void {
    if (problem === 'ADD_NEW') {
      this.selectedProblem = null;
      this.showAddProblemInput = true;
      this.newProblem = '';
    } else {
      this.selectedProblem = problem;
      this.showAddProblemInput = false;
      this.newProblem = '';
    }
    this.resetStep('problemSpecific');
  }

  addNewProblem(): void {
    const problemToAdd = this.newProblem?.trim();
    if (!problemToAdd) return;

    let targetList: string[] | null = null;
    if (this.backendCategory === 'pc') {
      if (this.backendProblemType === 'materiel') targetList = this.materielProblems;
      else if (this.backendProblemType === 'logiciel') targetList = this.logicielProblems;
    } else if (this.backendCategory === 'electrique') {
      targetList = this.electriqueProblems;
    } else if (this.backendCategory === 'divers') {
      targetList = this.diversProblems;
    }

    if (targetList && !targetList.some(p => p.toLowerCase() === problemToAdd.toLowerCase())) {
      const autreIndex = targetList.findIndex(p => p.startsWith('Autre'));
      if (autreIndex !== -1) {
        targetList.splice(autreIndex, 0, problemToAdd);
      } else {
        targetList.push(problemToAdd);
      }
      this.selectedProblem = problemToAdd;
    } else if (targetList) {
      const existingProblem = targetList.find(p => p.toLowerCase() === problemToAdd.toLowerCase());
      this.selectedProblem = existingProblem || problemToAdd;
    }

    this.newProblem = '';
    this.showAddProblemInput = false;
    this.resetStep('problemSpecific');
  }

  resetStep(level: string): void {
    if (level === 'location') {
      this.selectedCategoryKey = null; this.backendCategory = null;
      this.selectedPCId = null; this.pcs = [];
    }
    if (level === 'location' || level === 'category') {
      this.selectedProblemTypeKey = null; this.backendProblemType = null;
      if (level === 'category') this.selectedPCId = null;
    }
    if (level === 'location' || level === 'category' || level === 'categorySpecific') {
      this.selectedProblem = null;
      this.selectedClimatiseurOption = null;
      this.selectedProjectorState = null;
      this.showAddProblemInput = false; this.newProblem = '';
      if (this.backendCategory !== 'pc') {
        this.selectedPCId = null;
        this.selectedProblemTypeKey = null; this.backendProblemType = null;
      }
    } else if (level === 'pcSpecific') {
      this.selectedProblemTypeKey = null; this.backendProblemType = null;
      this.selectedProblem = null;
      this.showAddProblemInput = false; this.newProblem = '';
    } else if (level === 'problemTypeSpecific') {
      this.selectedProblem = null;
      this.showAddProblemInput = false; this.newProblem = '';
    } else if (level === 'problemSpecific') {
      this.selectedClimatiseurOption = null;
      this.selectedProjectorState = null;
    }
  }

  isFormComplete(): boolean {
    if (!this.selectedLocation || !this.selectedLocationId || !this.backendCategory) {
      return false;
    }
    if (this.backendCategory === 'pc') {
      if (!this.selectedPCId) return false;
      if (!this.backendProblemType) return false;
    }
    if (!this.selectedProblem) {
      return false;
    }
    return true;
  }

  onSubmit(form: NgForm): void {
    this.submitSuccess = null;
    this.submitError = null;

    if (!form.valid || !this.isFormComplete()) {
      console.error('Form is invalid or incomplete.');
      this.submitError = 'Veuillez remplir tous les champs requis et faire toutes les sélections nécessaires.';
      Object.values(form.controls).forEach(control => control.markAsTouched());
      return;
    }

    this.isSubmitting = true;

    let generalDescription = this.problemDescription.trim();
    let specificProblemDescription = this.selectedProblem!;

const payload: CreateReclamationRequest = {
  lieu: this.selectedLocation!.toLowerCase() as 'labo' | 'salle' | 'bureau',
  category: this.backendCategory!,
  laboratoire: (this.selectedLocation === 'Labo' && this.selectedLocationId) ? this.selectedLocationId : null,
  salle: (this.selectedLocation === 'Salle' && this.selectedLocationId) ? this.selectedLocationId : null,
  bureau: (this.selectedLocation === 'Bureau' && this.selectedLocationId) ? this.selectedLocationId : null,
  equipement: (this.backendCategory === 'pc' && this.selectedPCId) ? this.selectedPCId : null,
  description_generale: '',
  status: 'en_attente',
  pc_details: undefined,
  electrique_details: undefined,
  divers_details: undefined,
};
    if (payload.category === 'pc' && this.backendProblemType && this.selectedProblem) {
      payload.pc_details = {
        type_probleme: this.backendProblemType,
        description_probleme: this.selectedProblem,
        laboId: this.selectedLocationId
      };
      specificProblemDescription = this.selectedProblem;

    } else if (payload.category === 'electrique' && this.selectedProblem) {
      const backendElectriqueType = this.electriqueProblemMap[this.selectedProblem] || 'autre';
      specificProblemDescription = this.selectedProblem;

      if (this.selectedProblem === 'Climatiseur' && this.selectedClimatiseurOption) {
        specificProblemDescription = `${this.selectedProblem} (${this.selectedClimatiseurOption})`;
      }
      payload.electrique_details = {
        type_probleme: backendElectriqueType,
        description_probleme: specificProblemDescription
      };

    } else if (payload.category === 'divers' && this.selectedProblem) {
      const backendDiversType = this.diversProblemMap[this.selectedProblem] || 'autre';
      specificProblemDescription = this.selectedProblem;

      if (this.selectedProblem === 'Vidéo projecteur' && this.selectedProjectorState) {
        specificProblemDescription = `${this.selectedProblem} (${this.selectedProjectorState})`;
      }
      payload.divers_details = {
        type_probleme: backendDiversType,
        description_probleme: specificProblemDescription
      };
    }

    payload.description_generale = generalDescription || specificProblemDescription || 'Non spécifiée';

    console.log('Submitting Payload:', JSON.stringify(payload, null, 2));

    const submitSub = this.reclamationService.createReclamation(payload).subscribe({
      next: (response) => {
        console.log('Reclamation created successfully:', response);
        this.submitSuccess = true;
        this.isSubmitting = false;
        this.resetForm(form);
      },
      error: (error) => {
        console.error('Error creating reclamation:', error);
        let detailedErrorMessage = `Erreur ${error.status || ''}: `;
        if (error.error && typeof error.error === 'object') {
          const errorFields = Object.keys(error.error);
          if (errorFields.length > 0) {
            errorFields.forEach(key => {
              const fieldErrors = Array.isArray(error.error[key]) ? error.error[key].join(', ') : String(error.error[key]);
              detailedErrorMessage += `${key}: ${fieldErrors}. `;
            });
          } else {
            detailedErrorMessage += error.message || 'Une erreur inconnue est survenue.';
          }
        } else if (error.message) {
          detailedErrorMessage += error.message;
        } else {
          detailedErrorMessage += 'Vérifiez la console pour plus de détails.';
        }
        this.submitError = detailedErrorMessage.trim();
        this.submitSuccess = false;
        this.isSubmitting = false;
      }
    });
    this.subscriptions.push(submitSub);
  }

  resetForm(form?: NgForm): void {
    if (form) {
      form.resetForm();
    }
    this.selectedLocation = null;
    this.selectedLocationId = null;
    this.selectedCategoryKey = null;
    this.backendCategory = null;
    this.pcs = [];
    this.selectedPCId = null;
    this.isLoadingPCs = false;
    this.pcLoadingError = null;
    this.selectedProblemTypeKey = null;
    this.backendProblemType = null;
    this.selectedProblem = null;
    this.showAddProblemInput = false;
    this.newProblem = '';
    this.selectedClimatiseurOption = null;
    this.selectedProjectorState = null;
    this.problemDescription = '';
    this.isSubmitting = false;
  }

  annulerFormulaire(form: NgForm): void {
    this.resetForm(form);
    this.submitSuccess = null;
    this.submitError = null;
  }
}