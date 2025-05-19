import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Users } from './models/Users'; // Assurez-vous que ce modèle est pertinent ou supprimez-le si non utilisé ici

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // URLs API existantes
  private registerUrl = "http://127.0.0.1:8000/api/users/register/";
  private loginUrl = "http://127.0.0.1:8000/api/users/login/";
  private apiUrl = "http://127.0.0.1:8000/api";

  // Nouvelle URL de base pour la réinitialisation de mot de passe
  private passwordResetBaseUrl = "http://127.0.0.1:8000/reset-password"; // Basé sur votre urls.py principal

  constructor(private http: HttpClient) {}

  register(user: Users): Observable<any> {
    return this.http.post(this.registerUrl, user);
  }

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(this.loginUrl, credentials);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUserById(userId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.apiUrl}/users/users/${userId}/`, { headers });
  }

  updateUserProfile(userId: number, userData: FormData): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`
      // Content-Type est géré par le navigateur pour FormData
    });
    return this.http.patch<any>(`${this.apiUrl}/users/user/update/${userId}/`, userData, { headers });
  }

  // NOUVELLE MÉTHODE : Demander la réinitialisation du mot de passe
  requestPasswordReset(email: string): Observable<any> {
    const forgotPasswordUrl = `${this.passwordResetBaseUrl}/forgot-password/`; // URL complète
    return this.http.post(forgotPasswordUrl, { email }); // Envoyer juste l'email dans le corps
  }

  // NOUVELLE MÉTHODE : Réinitialiser le mot de passe avec le token
  resetPassword(token: string, password: string): Observable<any> {
    const resetPasswordUrl = `${this.passwordResetBaseUrl}/${token}/`; // URL complète avec le token
    return this.http.post(resetPasswordUrl, { password }); // Envoyer le nouveau mot de passe
  }


  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getToken()}`
    });
  }
}