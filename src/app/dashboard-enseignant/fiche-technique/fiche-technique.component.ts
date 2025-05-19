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
  selector: 'app-fiche-technique',
  templateUrl: './fiche-technique.component.html',
  styleUrls: ['./fiche-technique.component.css']
})
export class FicheTechniqueComponent {

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
  selectedLocationId: number | null = null;
  isLoadingLocations = false;
  selectedCategoryKey: 'PC' | 'Electrique' | 'Divers' | null = null;
  backendCategory: 'pc' | 'electrique' | 'divers' | null = null;
  pcs: PC[] = [];
  selectedPCId: number | null = null;
  isLoadingPCs = false;
  selectedProblemTypeKey: 'Matériel' | 'Logiciel' | null = null;
  backendProblemType: 'materiel' | 'logiciel' | null = null;
  materielProblems: string[] = ['Clavier', 'Souris', 'Écran', 'Unité centrale', 'Port USB'];
  logicielProblems: string[] = ['Système d\'exploitation', 'Logiciel spécifique', 'Connexion réseau', 'Virus/Malware'];
  electriqueProblems: string[] = ['Prise électrique', 'Climatiseur', 'Éclairage', 'Coupure générale'];
  diversProblems: string[] = ['Tableau blanc', 'Vidéo projecteur', 'Chaise/Table', 'Fenêtre/Porte'];
  selectedProblem: string | null = null;
  showAddProblemInput = false;
  newProblem = '';
  climatiseurOptions: string[] =["En panne", "Dysfonctionnement partiel", "Absent"];

  problemDescription = '';

  selectedClimatiseurOption: string | null = null;
  projectorStateOptions: string[] = ['En panne', 'Dysfonctionnel', 'Absent'];
  selectedProjectorState: string | null = null;
  isSubmitting = false;
  submitSuccess: boolean | null = null;
  submitError: string | null = null;
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
    closeDetails(): void {
      this.viewMode = 'list'; // Go back to list view
      this.selectedReclamationDetails = null;
      this.detailsError = null;
  }
  loadPCs(laboratoireId: number): void {
    this.isLoadingPCs = true;
    this.pcs = [];
    this.selectedPCId = null;
    const pcSub = this.gestionService.getPCsByLaboratoire(laboratoireId).subscribe({
        next: data => this.pcs = data,
        error: err => {
            console.error(`Error fetching PCs for lab ${laboratoireId}:`, err);
            this.submitError = 'Erreur lors du chargement des PCs.'; // Inform user
        },
        complete: () => this.isLoadingPCs = false
    });
    this.subscriptions.push(pcSub);
}
  afficherSection(section: 'enseignant' | 'terminees' | 'nouvelle' | 'fiches-techniques') {
    this.sectionAffichee = section;
  }

  afficherReclamationsEnseignant() {
    this.sectionAffichee = 'enseignant';
  }

  afficherReclamationsTerminees() {
    this.sectionAffichee = 'terminees';
  }

  }