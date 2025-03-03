import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  email: string = '';

  constructor(private router: Router) {}

  sendEmail() {
    if (this.email) {
      console.log("Email envoyé à : ", this.email);
      alert('Un email de réinitialisation a été envoyé.');
      this.router.navigate(['/login']);
    } else {
      alert('Veuillez entrer un email valide.');
    }
  }
}
