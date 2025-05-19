import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';

import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { NgForm } from '@angular/forms';
import { AuthService } from '../../auth.service';
import { UserProfile } from '../../models/UserProfile';
import { GestionService } from '../../services/gestion.service';
interface Salle { id: number; nom: string;}
interface Bureau { id: number; nom: string;}

@Component({
  selector: 'app-enseignant',
  templateUrl: './enseignant.component.html',
  styleUrls: ['./enseignant.component.css']
})
export class EnseignantComponent {

  sectionAffichee = 'fiches-techniques';
  userId!:number;
  searchTerm: string = '';
  private searchTerms = new Subject<string>();
  isLoading = false;
  errorMessage: string | null = null;
isSidebarVisible:boolean=true;
  /** reclamtion */
  selectedLocation: 'Labo' | 'Salle' | 'Bureau' | null = null;
  salles: Salle[] = [];
  bureaux: Bureau[] = [];
  selectedLocationId: number | null = null;
  isLoadingLocations = false;

  selectedProjectorState: string | null = null;
  isSubmitting = false;
  submitSuccess: boolean | null = null;
  submitError: string | null = null;
   private subscriptions: Subscription[] = [];

   

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