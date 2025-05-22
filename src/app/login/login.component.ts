import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;
  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }
ngOnInit() {
    // Si l'utilisateur est déjà connecté, le rediriger vers son dashboard
    if (this.authService.isLoggedIn()) {
      this.authService.redirectToUserDashboard();
    }
  }

  onLogin() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      this.authService.login(this.loginForm.value).subscribe({
        next: (response) => {
          if (response.access) {
            // Sauvegarder le token
            localStorage.setItem('token', response.access);
            
            // Sauvegarder le refresh token si disponible
            if (response.refresh) {
              localStorage.setItem('refreshToken', response.refresh);
            }

            // Récupérer les informations utilisateur depuis l'API
            this.authService.fetchUserInfo().subscribe({
              next: (userInfo) => {
                // Sauvegarder les informations utilisateur (incluant le rôle)
                this.authService.saveUserInfo(userInfo);
                
                // Rediriger vers le dashboard approprié selon le rôle
                this.authService.redirectToUserDashboard();
                this.isLoading = false;
              },
              error: (error) => {
                console.error('Erreur lors de la récupération des informations utilisateur:', error);
                // Même en cas d'erreur, on peut essayer de rediriger vers un dashboard par défaut
                this.router.navigate(['/profil']);
                this.isLoading = false;
              }
            });
          } else {
            this.errorMessage = "Erreur lors de la connexion.";
            this.isLoading = false;
          }
        },
        error: (error) => {
          console.error('Erreur de connexion:', error);
          this.errorMessage = "Identifiants incorrects ou problème de connexion.";
          this.isLoading = false;
        }
      });
    } else {
      this.errorMessage = "Veuillez remplir correctement le formulaire.";
    }
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  goToForgotPassword() {
    this.router.navigate(['/forgot-password']);
  }
}