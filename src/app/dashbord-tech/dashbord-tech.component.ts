import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Laboratoire, PC, LaboratoireData, PCData } from '../models/gestion.model'; // Adaptez le chemin
import { GestionService } from '../services/gestion.service';
import { AuthService } from '../auth.service';
import { JwtHelperService } from '@auth0/angular-jwt';
import { UserProfile } from '../models/UserProfile';
import { Router } from '@angular/router';
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
  userId!:number;

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
    private gestionService: GestionService,
        private authService: AuthService,
    
    private router: Router
  ) {
    // Configuration de la recherche avec debounce
 
  }



logout(){
  this.authService.logout()
  this.router.navigate(["/login"])

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
        error: (err: { status: number; error: { message: any; }; }) => {
          console.error('Erreur récupération utilisateur:', err);
          this.error = `Erreur lors de la récupération des données (${err.status}): ${err.error?.message || 'Erreur inconnue'}`;
          
          if (err.status === 401) {
            this.authService.logout();
            this.router.navigate(['/login']);
          }
        }
      });

    }
  
  toggleSidebar(): void {
    this.isSidebarVisible = !this.isSidebarVisible;
  }





}