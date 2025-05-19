import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../auth.service'; // Assurez-vous que le chemin est correct
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-new-password',
  templateUrl: './new-password.component.html',
  styleUrls: ['./new-password.component.css']
})
export class NewPasswordComponent implements OnInit {
  token: string | null = null;
  password: string = '';
  confirmPassword: string = '';
  isLoading: boolean = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  passwordsMismatch: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Récupérer le token depuis les paramètres de la route
    this.route.paramMap.subscribe(params => {
      this.token = params.get('token');
      if (!this.token) {
        this.errorMessage = "Token de réinitialisation manquant ou invalide.";
        // Optionnel : Rediriger si pas de token
        // setTimeout(() => this.router.navigate(['/login']), 3000);
      }
      // Optionnel : Ajouter un appel GET ici pour valider le token avant d'afficher le formulaire
      // this.validateToken(this.token);
    });
  }

  // Optionnel : Méthode pour valider le token au chargement
  /*
  validateToken(token: string | null): void {
    if (!token) return;
    this.isLoading = true;
    // Vous auriez besoin d'une méthode dans AuthService pour appeler le GET /reset-password/{token}/
    this.authService.validateResetToken(token).subscribe({
       next: () => {
         this.isLoading = false;
         console.log("Token valide.");
       },
       error: (error: HttpErrorResponse) => {
          this.isLoading = false;
          this.errorMessage = error.error?.error || "Le lien est invalide ou a expiré.";
          // Désactiver le formulaire ou rediriger
       }
    });
  }
  */

  checkPasswords(): void {
    this.passwordsMismatch = this.password !== '' && this.confirmPassword !== '' && this.password !== this.confirmPassword;
  }

  onSubmit(): void {
    this.errorMessage = null;
    this.successMessage = null;
    this.checkPasswords(); // Vérifier avant de soumettre

    if (this.passwordsMismatch) {
      this.errorMessage = 'Les mots de passe ne correspondent pas.';
      return;
    }

    if (!this.password || this.password.length < 8) {
       this.errorMessage = 'Le mot de passe doit contenir au moins 8 caractères.';
       return;
    }

    if (!this.token) {
      this.errorMessage = "Token de réinitialisation invalide ou manquant.";
      return;
    }

    this.isLoading = true;

    this.authService.resetPassword(this.token, this.password).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = response.message || 'Votre mot de passe a été réinitialisé avec succès !';
        // Rediriger vers la page de connexion après un court délai
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000); // 3 secondes
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        this.errorMessage = error.error?.error || `Une erreur est survenue (${error.status}). Veuillez réessayer ou demander un nouveau lien.`;
        console.error('Erreur lors de la réinitialisation du mot de passe:', error);
      }
    });
  }

   goToLogin() {
     this.router.navigate(['/login']);
   }
}