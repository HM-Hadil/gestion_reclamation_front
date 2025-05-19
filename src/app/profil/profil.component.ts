import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { AuthService } from '../auth.service';
import { UserProfile } from '../models/UserProfile';

@Component({
  selector: 'app-profil',
  templateUrl: './profil.component.html',
  styleUrls: ['./profil.component.css']
})
export class ProfilComponent implements OnInit {
  // Assurer que l'interface UserProfile utilisée ici correspond exactement à cette déclaration
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

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    
    this.extractUserIdFromToken();
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
  }

  onFileChange(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.profilePicture = reader.result;
      };
      reader.readAsDataURL(file); // Utiliser directement la variable locale file qui est garantie non-null
    }
  }

  saveProfile(): void {
    this.loading = true;
    this.error = '';
    this.success = false;

    if (!this.user.id) {
      this.error = 'ID utilisateur manquant.';
      this.loading = false;
      return;
    }

    const formData = new FormData();
    // Sécuriser les valeurs nulles ou undefined
    formData.append('first_name', this.user.firstName || '');
    formData.append('last_name', this.user.lastName || '');
    
    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    console.log('Envoi de données:', {
      firstName: this.user.firstName,
      lastName: this.user.lastName,
      hasImage: !!this.selectedFile
    });

    this.authService.updateUserProfile(this.user.id, formData).subscribe({
      next: (res: any) => {
        console.log('Réponse de mise à jour:', res);
        this.success = true;
        this.loading = false;
        this.selectedFile = null; // Reset file selection
        
        // Rafraîchir les données - avec conversion en nombre pour plus de sécurité
        if (this.user.id) {
          this.fetchUserData(+this.user.id);
        }
        
        // Masquer le message de succès après 3 secondes
        setTimeout(() => {
          this.success = false;
        }, 3000);
      },
      error: (err) => {
        console.error('Erreur mise à jour:', err);
        this.error = `Erreur lors de la mise à jour (${err.status || '?'}): ${
          err.error?.message || err.error?.detail || 'Erreur inconnue'
        }`;
        this.loading = false;
        
        if (err.status === 401) {
          this.authService.logout();
          this.router.navigate(['/login']);
        }
      }
    });
  }
}