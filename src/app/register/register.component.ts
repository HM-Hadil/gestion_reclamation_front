import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { Users } from '../models/Users';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
   registerForm: FormGroup;
   successMessage: string = '';
   errorMessage: string = '';

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.registerForm = this.fb.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email, emailDomainValidator]], // Ajout du validateur
      role: ['enseignant', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit() {
    console.log('Form data:', this.registerForm.value);
    const newUser: Users = {
      first_name: this.registerForm.value.first_name,
      last_name: this.registerForm.value.last_name,
      email: this.registerForm.value.email,
      password: this.registerForm.value.password,
      role: this.registerForm.value.role
    };

    console.log('User model:', newUser);

    this.authService.register(newUser).subscribe(
      response => {
        console.log('Response:', response);
        this.successMessage = "Inscription réussie ! Redirection vers la page de connexion...";

        setTimeout(() => {
          this.router.navigate(['/login']); // Redirection après 2 secondes
        }, 2000);
      },
      error => {
        this.errorMessage = "Échec de l'inscription. Vérifiez vos informations.";
      }
    );
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}

// Fonction de validation personnalisée
function emailDomainValidator(control: AbstractControl): ValidationErrors | null {
  const email = control.value;
  const emailPattern = /^[a-zA-Z]+(\.[a-zA-Z]+)?@isimg\.tn$/;

  if (email && !emailPattern.test(email)) {
    return { invalidDomain: true };
  }
  return null;
}
