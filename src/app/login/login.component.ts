import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  constructor(private router: Router) {}
  goToRegister() {
    this.router.navigate(['/register']); // Redirige vers la page Register
  }

navigateToRegister() {
throw new Error('Method not implemented.');
}
  username: string = '';
  password: string = '';

  onLogin() {
    // Logique pour se connecter
    if (this.username === 'user' && this.password === 'password') {
      console.log('Connexion réussie');
    } else {
      console.log('Identifiants incorrects');
    }
  }
  goToForgotPassword() {
    this.router.navigate(['/forgot-password']);
  }


  
}
