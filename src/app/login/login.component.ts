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

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onLogin() {
    if (this.loginForm.valid) {
      this.authService.login(this.loginForm.value).subscribe(response => {
        if (response.access) {
          localStorage.setItem('token', response.access); // Sauvegarde du token d'accès
          this.router.navigate(['/enseignant']);
        } else {
          this.errorMessage = "Erreur lors de la connexion.";
        }
      }, error => {
        this.errorMessage = "Identifiants incorrects ou problème de connexion.";
      });
    } else {
      this.errorMessage = "Veuillez remplir correctement le formulaire.";
    }
  }
  

  goToRegister() {
    this.router.navigate(['/register']);
  }
}
