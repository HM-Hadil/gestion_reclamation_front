import { Component } from '@angular/core';
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
export class MyReclamationsComponent {

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

  // Méthode appelée quand l'utilisateur tape dans la barre de recherche
  onSearch(event: Event): void {
    const term = (event.target as HTMLInputElement).value;
    this.searchTerms.next(term);
  }

  // Filtrer les labos en fonction du terme de recherche
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

  // Ouvrir le modal avec les détails du labo
  openLaboDetails(labo: Laboratoire): void {
    // Si les PCs ne sont pas encore chargés pour ce labo, les charger
    if (!labo.pcs || labo.pcs.length === 0) {
      this.gestionService.getPCsByLaboratoire(labo.id).subscribe({
        next: (pcs) => {
          labo.pcs = pcs;
          this.selectedLabo = labo;
        },
        error: (error) => {
          console.error(`Erreur lors du chargement des PCs pour le labo ${labo.id}`, error);
          this.selectedLabo = labo; // On affiche quand même le labo sans ses PCs
        }
      });
    } else {
      this.selectedLabo = labo;
    }
  }

  // Fermer le modal
  closeLaboDetails(): void {
    this.selectedLabo = null;
  }

  // Changer la section affichée
  changerSection(section: string): void {
    this.sectionAffichee = section;
  }
  //sectionAffichee = 'fiches-techniques';
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
  
  
  
    ngOnInit(): void {
      if (!this.authService.isLoggedIn()) {
        this.router.navigate(['/login']);
        return;
      }
      
      this.extractUserIdFromToken();
      this.loadMyReclamations(); 
      console.log('ngOnInit started. Initial viewMode:', this.viewMode);
    
    }
    ngOnDestroy(): void {
      // Unsubscribe from all observables to prevent memory leaks
      this.subscriptions.forEach(sub => sub.unsubscribe());
  }
  
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
          this.userId=userId;
          this.user.id = +userId; // Conversion en nombre
          this.fetchUserData(userId);
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
  console.log('viewReclamationDetails called with ID:', reclamationId); // <-- Add this line
    if (!reclamationId) {
        console.warn('No reclamationId provided.'); // <-- Add this line
        return;
    }

    this.viewMode = 'details'; // Switch view
  console.log('viewMode set to:', this.viewMode); // <-- Add this line
    this.isLoadingDetails = true;
    this.detailsError = null;
    this.selectedReclamationDetails = null;

    const detailSub = this.reclamationService.getReclamationById(reclamationId).subscribe({
        next: (data) => {
            console.log('Reclamation details received:', data); // <-- Add this line
            this.selectedReclamationDetails = data;
             // Attempt to populate PC identifier if needed and not already available
             if (data.equipement && !this.pcIdentifierMap[data.equipement]) {
                // Option 1: Fetch the specific PC (can be slow if viewing many details)
                 // this.loadSpecificPCInfo(data.equipement);
                 // Option 2: Show ID (simpler) - We'll stick with this for now.
             }
            this.isLoadingDetails = false;
        },
        error: (err) => {
            console.error(`Error fetching details for reclamation ${reclamationId}:`, err); // <-- Check this error
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
          
          // Mise à jour sécurisée des propriétés de l'utilisateur
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
  
//** get reclamation */


  // --- View Switching Methods (NEW) ---
  switchToListView(): void {
    this.viewMode = 'list';
    this.selectedReclamationDetails = null; // Clear details
    this.detailsError = null;
    // Optionally reload list if data might be stale
    // this.loadMyReclamations();
}
switchToFormView(): void {
  this.viewMode = 'form';

  this.selectedReclamationDetails = null; // Clear details
  this.detailsError = null;
}

newreclamation()
{
  this.router.navigate(["/enseignant/create-reclamation"])
}    // --- Reclamation List & Details Logic (NEW Methods) ---

    loadMyReclamations(): void {
      this.isLoadingReclamations = true;
      this.reclamationsError = null;
    console.log('loadMyReclamations called. userId:', this.userId); // <-- Assurez-vous que cette ligne est là

      const reclamSub = this.reclamationService.getUserReclamationsById(this.userId).subscribe({
          next: (data) => {
              this.myReclamations = data.sort((a, b) => new Date(b.date_creation).getTime() - new Date(a.date_creation).getTime()); // Sort by date desc
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
      this.viewMode = 'list'; // Go back to list view
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
          default: return status; // Fallback
      }
  }

  getStatusClass(status: 'en_attente' | 'en_cours' | 'termine'): string {
      switch (status) {
          case 'en_attente': return 'status-pending';    // e.g., text-orange-600 bg-orange-100
          case 'en_cours': return 'status-progress';   // e.g., text-blue-600 bg-blue-100
          case 'termine': return 'status-completed'; // e.g., text-green-600 bg-green-100
          default: return 'status-unknown';      // e.g., text-gray-600 bg-gray-100
      }
  }

  // Helper to get a displayable location name
  getLocationDisplayName(reclamation: Reclamation): string {
      let name = '';
      switch (reclamation.lieu) {
          case 'labo':
              name = this.laboNameMap[reclamation.laboratoire!] || `ID: ${reclamation.laboratoire}`;
              return `Labo ${name}`;
          case 'salle':
              // Assuming backend might provide salle_id or bureau_id directly on reclamation if not 'labo'
              const salleId = (reclamation as any).salle_id; // Adjust if backend provides ID differently
              name = salleId ? (this.salleNameMap[salleId] || `ID: ${salleId}`) : '';
              return `Salle ${name}`;
          case 'bureau':
               const bureauId = (reclamation as any).bureau_id; // Adjust if backend provides ID differently
               name = bureauId ? (this.bureauNameMap[bureauId] || `ID: ${bureauId}`) : '';
              return `Bureau ${name}`;
          default:
              return reclamation.lieu || 'Inconnu';
      }
  }

   // Helper to get a summary for the list view
   getReclamationSummary(reclamation: Reclamation): string {
      let summary = `Réclamation #${reclamation.id} (${this.getCategoryDisplayName(reclamation.category)}) - ${this.getLocationDisplayName(reclamation)}`;
      // Add more detail if needed, e.g., from description or specific details
      if (reclamation.pc_details?.type_probleme) {
          summary += ` - ${reclamation.pc_details.type_probleme === 'materiel' ? 'Matériel' : 'Logiciel'}: ${reclamation.pc_details.description_probleme || ''}`;
      } else if (reclamation.electrique_details?.type_probleme) {
           summary += ` - ${reclamation.electrique_details.description_probleme || reclamation.electrique_details.type_probleme}`;
      } else if (reclamation.divers_details?.type_probleme) {
           summary += ` - ${reclamation.divers_details.description_probleme || reclamation.divers_details.type_probleme}`;
      } else if (reclamation.description_generale) {
          summary += ` - ${reclamation.description_generale}`;
      }
      return summary.length > 100 ? summary.substring(0, 97) + '...' : summary; // Truncate long summaries
  }


trackReclamationById(index: number, reclamation: any): number | string { 

 return reclamation.id; 
}
//** end get recl */


}