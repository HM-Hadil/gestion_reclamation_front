import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service'; // Assurez-vous que le chemin est correct
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  email: string = '';
  isLoading: boolean = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  // Renommé pour correspondre à (ngSubmit)
  onSubmit(): void {
    if (!this.email) {
      this.errorMessage = 'Veuillez entrer une adresse email.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    this.authService.requestPasswordReset(this.email).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = response.message || 'Si un compte existe pour cet email, un lien de réinitialisation a été envoyé.';
        this.email = ''; // Optionnel: vider le champ après succès
        // Ne pas rediriger immédiatement, laisser l'utilisateur lire le message
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        if (error.status === 404) {
          // On peut afficher un message générique pour ne pas révéler quels emails existent
          this.errorMessage = "Si un compte existe pour cet email, un lien de réinitialisation a été envoyé.";
           // Ou afficher l'erreur spécifique si vous préférez :
           // this.errorMessage = error.error?.error || 'Aucun utilisateur trouvé avec cet email.';
        } else {
           this.errorMessage = error.error?.error || error.error?.message || `Une erreur est survenue (${error.status}). Veuillez réessayer.`;
        }
        console.error('Erreur lors de la demande de réinitialisation:', error);
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

   goToRegister() {
     this.router.navigate(['/register']);
   }
}