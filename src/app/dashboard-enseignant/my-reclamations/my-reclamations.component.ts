import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { AuthService } from '../../auth.service';
import { UserProfile } from '../../models/UserProfile';
import { Laboratoire, PC } from '../../models/gestion.model';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { GestionService } from '../../services/gestion.service';
import { CreateReclamationRequest, Reclamation } from '../../models/reclamation.model';
import { ReclamationService } from '../../services/reclamation.service';
import { NgForm } from '@angular/forms';

interface Salle { id: number; nom: string;}
interface Bureau { id: number; nom: string;}

@Component({
  selector: 'app-my-reclamations',
  templateUrl: './my-reclamations.component.html',
  styleUrls: ['./my-reclamations.component.css']
})
export class MyReclamationsComponent implements OnInit, OnDestroy { // Implement OnInit and OnDestroy

  laboratoires: Laboratoire[] = [];
  filteredLabos: Laboratoire[] = [];
  selectedLabo: Laboratoire | null = null;
  sectionAffichee = 'fiches-techniques';
  userId!:number;
  searchTerm: string = '';
  private searchTerms = new Subject<string>();
  isLoading = false;
  errorMessage: string | null = null;
  isSidebarVisible:boolean=false;
  
  /** reclamtion */
  selectedLocation: 'Labo' | 'Salle' | 'Bureau' | null = null;
  salles: Salle[] = [];
  bureaux: Bureau[] = [];
  
  pcs: PC[] = [];
  selectedPCId: number | null = null;
  isLoadingPCs = false;
  private subscriptions: Subscription[] = [];

  // get reclamtion serction 
  viewMode: 'list' | 'form' | 'details' = 'list'; // Start by showing the list
  myReclamations: Reclamation[] = [];
  pendingReclamations: Reclamation[] = []; // NEW: Array to hold pending reclamations
  isLoadingReclamations = false;
  reclamationsError: string | null = null;

  selectedReclamationDetails: Reclamation | null = null;
  isLoadingDetails = false;
  detailsError: string | null = null;

  // Assuming GestionService provides these, or they are fetched separately
  // For simplicity, we'll map IDs to names if available, otherwise show IDs.
  laboNameMap: { [id: number]: string } = {};
  salleNameMap: { [id: number]: string } = {};
  bureauNameMap: { [id: number]: string } = {};
  pcIdentifierMap: { [id: number]: string } = {};

  constructor(
    private gestionService: GestionService,
    private authService: AuthService,
    private reclamationService: ReclamationService,
    private router: Router
  ) {
    // Configuration de la recherche avec debounce
    this.searchTerms.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      this.filterLabos(term);
    });
  }

  // Ensure ngOnInit is implemented
  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    
    this.extractUserIdFromToken();
    // No need to call loadMyReclamations() here, it will be called after userId is set in extractUserIdFromToken
    console.log('ngOnInit started. Initial viewMode:', this.viewMode);
    this.loadAllMappings();
  }

  ngOnDestroy(): void {
    // Unsubscribe from all observables to prevent memory leaks
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadLaboratoires(): void {
    this.isLoading = true;
    this.errorMessage = null;
    
    this.gestionService.getLaboratoires().subscribe({
      next: (data) => {
        this.laboratoires = data;
        this.filteredLabos = [...this.laboratoires];
        this.isLoading = false;
        
        // Pour chaque laboratoire, charger ses PCs
        this.laboratoires.forEach(labo => {
          this.loadPCsForLaboratoire(labo.id);
        });
      },
      error: (error) => {
        console.error('Erreur lors du chargement des laboratoires', error);
        this.errorMessage = `Erreur: ${error.message}`;
        this.isLoading = false;
      }
    });
  }

  loadPCsForLaboratoire(laboId: number): void {
    this.gestionService.getPCsByLaboratoire(laboId).subscribe({
      next: (pcs) => {
        // Trouver le laboratoire correspondant et lui assigner ses PCs
        const labo = this.laboratoires.find(l => l.id === laboId);
        if (labo) {
          labo.pcs = pcs;
          
          // Mettre à jour filteredLabos aussi pour refléter le changement
          const filteredLabo = this.filteredLabos.find(l => l.id === laboId);
          if (filteredLabo) {
            filteredLabo.pcs = pcs;
          }
        }
      },
      error: (error) => {
        console.error(`Erreur lors du chargement des PCs pour le labo ${laboId}`, error);
      }
    });
  }

  onSearch(event: Event): void {
    const term = (event.target as HTMLInputElement).value;
    this.searchTerms.next(term);
  }

  filterLabos(term: string): void {
    if (!term.trim()) {
      this.filteredLabos = [...this.laboratoires];
      return;
    }
    
    const searchTerm = term.toLowerCase();
    this.filteredLabos = this.laboratoires.filter(labo => {
      return labo.nom.toLowerCase().includes(searchTerm) ||
             labo.modele_postes.toLowerCase().includes(searchTerm) ||
             labo.processeur.toLowerCase().includes(searchTerm) ||
             (labo.pcs && labo.pcs.some(pc => 
               pc.poste.toLowerCase().includes(searchTerm) ||
               pc.sn_inventaire.toLowerCase().includes(searchTerm) ||
               pc.logiciels_installes.toLowerCase().includes(searchTerm)
             ));
    });
  }

  openLaboDetails(labo: Laboratoire): void {
    if (!labo.pcs || labo.pcs.length === 0) {
      this.gestionService.getPCsByLaboratoire(labo.id).subscribe({
        next: (pcs) => {
          labo.pcs = pcs;
          this.selectedLabo = labo;
        },
        error: (error) => {
          console.error(`Erreur lors du chargement des PCs pour le labo ${labo.id}`, error);
          this.selectedLabo = labo; 
        }
      });
    } else {
      this.selectedLabo = labo;
    }
  }

  closeLaboDetails(): void {
    this.selectedLabo = null;
  }

  changerSection(section: string): void {
    this.sectionAffichee = section;
  }

  user: UserProfile = {
    id: null,
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    image: null
  };
  
  profilePicture: string | ArrayBuffer | null = null;
  selectedFile: File | null = null;
  loading = false;
  success = false;
  error = '';
  
  private jwtHelper = new JwtHelperService();
  
  extractUserIdFromToken(): void {
    const token = localStorage.getItem('token');
    if (!token) {
      this.error = 'Vous devez être connecté.';
      return;
    }
  
    try {
      const decoded = this.jwtHelper.decodeToken(token);
      const userId = decoded?.user_id || decoded?.id || decoded?.sub;
  
      if (userId) {
        this.userId = +userId; // Conversion en nombre
        this.user.id = +userId; 
        this.fetchUserData(userId);
        this.loadMyReclamations(); // Call loadMyReclamations here after userId is set
      } else {
        this.error = 'ID utilisateur introuvable dans le token.';
      }
    } catch (err) {
      console.error('Erreur token:', err);
      this.error = 'Token invalide.';
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }
  
  viewReclamationDetails(reclamationId: number): void {
    console.log('viewReclamationDetails called with ID:', reclamationId);
    if (!reclamationId) {
      console.warn('No reclamationId provided.');
      return;
    }

    this.viewMode = 'details'; 
    console.log('viewMode set to:', this.viewMode);
    this.isLoadingDetails = true;
    this.detailsError = null;
    this.selectedReclamationDetails = null;

    const detailSub = this.reclamationService.getReclamationById(reclamationId).subscribe({
      next: (data) => {
        console.log('Reclamation details received:', data);
        this.selectedReclamationDetails = data;
        this.isLoadingDetails = false;
      },
      error: (err) => {
        console.error(`Error fetching details for reclamation ${reclamationId}:`, err); 
        this.detailsError = `Impossible de charger les détails: ${err.message || 'Erreur inconnue.'}`;
        this.isLoadingDetails = false;
      }
    });
    this.subscriptions.push(detailSub);
  }

  fetchUserData(userId: number): void {
    this.authService.getUserById(userId).subscribe({
      next: (data: any) => {
        console.log('Données utilisateur reçues:', data);
        
        this.user = {
          id: userId,
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          email: data.email || '',
          role: data.role || '',
          image: data.image || null
        };
        
        if (data.image) {
          this.profilePicture = data.image;
        }
      },
      error: (err) => {
        console.error('Erreur récupération utilisateur:', err);
        this.error = `Erreur lors de la récupération des données (${err.status}): ${err.error?.message || 'Erreur inconnue'}`;
        
        if (err.status === 401) {
          this.authService.logout();
          this.router.navigate(['/login']);
        }
      }
    });
    this.loadLaboratoires();
  }
  
  // --- View Switching Methods (NEW) ---
  switchToListView(): void {
    this.viewMode = 'list';
    this.selectedReclamationDetails = null; 
    this.detailsError = null;
  }

  switchToFormView(): void {
    this.viewMode = 'form';
    this.selectedReclamationDetails = null; 
    this.detailsError = null;
  }

  newreclamation() {
    this.router.navigate(["/enseignant/create-reclamation"]);
  } 

  // --- Reclamation List & Details Logic (NEW Methods) ---
  loadMyReclamations(): void {
    this.isLoadingReclamations = true;
    this.reclamationsError = null;
    console.log('loadMyReclamations called. userId:', this.userId); 

    const reclamSub = this.reclamationService.getUserReclamationsById(this.userId).subscribe({
      next: (data) => {
        // Sort all reclamations by date desc
        this.myReclamations = data.sort((a, b) => new Date(b.date_creation).getTime() - new Date(a.date_creation).getTime()); 
        
        // Filter for "en_attente" status
        this.pendingReclamations = this.myReclamations.filter(reclamation => reclamation.status === 'en_attente');
        
        this.isLoadingReclamations = false;
      },
      error: (err) => {
        console.error('Error fetching reclamations:', err);
        this.reclamationsError = `Erreur lors du chargement de vos réclamations: ${err.message || 'Erreur inconnue.'}`;
        this.isLoadingReclamations = false;
      }
    });
    this.subscriptions.push(reclamSub);
  }

  closeDetails(): void {
    this.viewMode = 'list'; 
    this.selectedReclamationDetails = null;
    this.detailsError = null;
  }

  // --- Helper Methods for Display (NEW/Updated) ---
  getCategoryDisplayName(category: 'pc' | 'electrique' | 'divers' | null): string {
    switch (category) {
      case 'pc': return 'PC';
      case 'electrique': return 'Électrique';
      case 'divers': return 'Divers';
      default: return 'Inconnue';
    }
  }

  getStatusDisplayName(status: 'en_attente' | 'en_cours' | 'termine'): string {
    switch (status) {
      case 'en_attente': return 'En attente';
      case 'en_cours': return 'En cours';
      case 'termine': return 'Terminé';
      default: return status; 
    }
  }
loadAllMappings(): void {
  this.loadLaboNames();
  this.loadSalleNames();
  this.loadBureauNames();
  this.loadPCNames();
}
  getStatusClass(status: 'en_attente' | 'en_cours' | 'termine'): string {
    switch (status) {
      case 'en_attente': return 'bg-orange-100 text-orange-600'; 
      case 'en_cours': return 'bg-blue-100 text-blue-600'; 
      case 'termine': return 'bg-green-100 text-green-600'; 
      default: return 'bg-gray-100 text-gray-600'; 
    }
  }
// Méthode utilitaire pour obtenir le nom d'un labo par son ID
getLaboNameById(id: number): string {
  return this.laboNameMap[id] || `Laboratoire #${id}`;
}

// Méthode utilitaire pour obtenir le nom d'une salle par son ID
getSalleNameById(id: number): string {
  return this.salleNameMap[id] || `Salle #${id}`;
}

// Méthode utilitaire pour obtenir le nom d'un bureau par son ID
getBureauNameById(id: number): string {
  return this.bureauNameMap[id] || `Bureau #${id}`;
}
// Charger les noms des salles
loadSalleNames(): void {
  const salleSub = this.gestionService.getSalles().subscribe({
    next: (salles) => {
      this.salleNameMap = {};
      salles.forEach(salle => {
        this.salleNameMap[salle.id] = salle.nom;
      });
      console.log('Salle names loaded:', this.salleNameMap);
    },
    error: (err) => {
      console.error('Erreur lors du chargement des noms de salles:', err);
    }
  });
  this.subscriptions.push(salleSub);
}
// Charger les noms des laboratoires
loadLaboNames(): void {
  const laboSub = this.gestionService.getLaboratoires().subscribe({
    next: (labos) => {
      this.laboNameMap = {};
      labos.forEach(labo => {
        this.laboNameMap[labo.id] = labo.nom;
      });
      console.log('Labo names loaded:', this.laboNameMap);
    },
    error: (err) => {
      console.error('Erreur lors du chargement des noms de laboratoires:', err);
    }
  });
  this.subscriptions.push(laboSub);
}
// Charger les noms des bureaux
loadBureauNames(): void {
  const bureauSub = this.gestionService.getBureaux().subscribe({
    next: (bureaux) => {
      this.bureauNameMap = {};
      bureaux.forEach(bureau => {
        this.bureauNameMap[bureau.id] = bureau.nom;
      });
      console.log('Bureau names loaded:', this.bureauNameMap);
    },
    error: (err) => {
      console.error('Erreur lors du chargement des noms de bureaux:', err);
    }
  });
  this.subscriptions.push(bureauSub);
}

// Charger les identifiants des PCs
loadPCNames(): void {
  const pcSub = this.gestionService.getAllPCs().subscribe({
    next: (pcs) => {
      this.pcIdentifierMap = {};
      pcs.forEach(pc => {
        // Utiliser le nom du poste ou l'ID comme identifiant
        this.pcIdentifierMap[pc.id] = pc.poste || `PC-${pc.id}`;
      });
      console.log('PC identifiers loaded:', this.pcIdentifierMap);
    },
    error: (err) => {
      console.error('Erreur lors du chargement des identifiants PC:', err);
    }
  });
  this.subscriptions.push(pcSub);
}

// Méthode utilitaire pour obtenir le nom d'un PC par son ID
getPCNameById(id: number): string {
  return this.pcIdentifierMap[id] || `PC #${id}`;
}
// Méthode améliorée pour obtenir le nom du lieu
getLocationDisplayName(reclamation: Reclamation): string {
  switch (reclamation.lieu) {
    case 'labo':
      if (reclamation.laboratoire) {
        return `Laboratoire: ${this.getLaboNameById(reclamation.laboratoire)}`;
      }
      return 'Laboratoire non spécifié';
      
    case 'salle':
      const salleId = (reclamation as any).salle_id;
      if (salleId) {
        return `Salle: ${this.getSalleNameById(salleId)}`;
      }
      return 'Salle non spécifiée';
      
    case 'bureau':
      const bureauId = (reclamation as any).bureau_id;
      if (bureauId) {
        return `Bureau: ${this.getBureauNameById(bureauId)}`;
      }
      return 'Bureau non spécifié';
      
    default:
      return reclamation.lieu || 'Lieu inconnu';
  }
}


// Méthode améliorée pour le résumé de réclamation
getReclamationSummary(reclamation: Reclamation): string {
  let summary = `${this.getCategoryDisplayName(reclamation.category)} - ${reclamation.lieu}`;
  
  // Ajouter l'équipement si spécifié
  if (reclamation.equipement) {
    summary += ` - Équipement: ${this.getPCNameById(reclamation.equipement)}`;
  }
  
  // Ajouter les détails spécifiques selon la catégorie
  if (reclamation.pc_details?.type_probleme) {
    const typeProbleme = reclamation.pc_details.type_probleme === 'materiel' ? 'Matériel' : 'Logiciel';
    summary += ` - ${typeProbleme}`;
    if (reclamation.pc_details.description_probleme) {
      summary += `: ${reclamation.pc_details.description_probleme.substring(0, 50)}${reclamation.pc_details.description_probleme.length > 50 ? '...' : ''}`;
    }
  } else if (reclamation.electrique_details?.type_probleme) {
    summary += ` - ${reclamation.electrique_details.type_probleme}`;
    if (reclamation.electrique_details.description_probleme) {
      summary += `: ${reclamation.electrique_details.description_probleme.substring(0, 50)}${reclamation.electrique_details.description_probleme.length > 50 ? '...' : ''}`;
    }
  } else if (reclamation.divers_details?.type_probleme) {
    summary += ` - ${reclamation.divers_details.type_probleme}`;
    if (reclamation.divers_details.description_probleme) {
      summary += `: ${reclamation.divers_details.description_probleme.substring(0, 50)}${reclamation.divers_details.description_probleme.length > 50 ? '...' : ''}`;
    }
  } else if (reclamation.description_generale) {
    summary += ` - ${reclamation.description_generale.substring(0, 50)}${reclamation.description_generale.length > 50 ? '...' : ''}`;
  }
  
  return summary;
}

  trackReclamationById(index: number, reclamation: any): number | string { 
    return reclamation.id; 
  }
}