import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { Users } from './models/Users';
import { jwtDecode } from 'jwt-decode'; 

interface JwtPayload {
  user_id: number;
  email?: string;
  role?: string;
  exp: number;
  iat: number;
  jti: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // URLs API existantes
  private registerUrl = "http://127.0.0.1:8000/api/users/register/";
  private loginUrl = "http://127.0.0.1:8000/api/users/login/";
  private apiUrl = "http://127.0.0.1:8000/api";
  private passwordResetBaseUrl = "http://127.0.0.1:8000/reset-password";

  constructor(private http: HttpClient, private router: Router) {}

  register(user: Users): Observable<any> {
    return this.http.post(this.registerUrl, user);
  }

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(this.loginUrl, credentials);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userInfo');
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      return decoded.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Nouvelle méthode pour obtenir le rôle de l'utilisateur
  getUserRole(): string | null {
    // D'abord, essayer de récupérer le rôle depuis localStorage
    const storedUserInfo = localStorage.getItem('userInfo');
    if (storedUserInfo) {
      try {
        const userInfo = JSON.parse(storedUserInfo);
        if (userInfo.role) {
          return userInfo.role;
        }
      } catch (error) {
        console.error('Erreur lors du parsing des informations utilisateur:', error);
      }
    }

    // Si pas de rôle stocké, essayer de le récupérer du token (au cas où il serait ajouté plus tard)
    const token = this.getToken();
    if (!token) return null;
    
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      return decoded.role || null;
    } catch {
      return null;
    }
  }

  // Nouvelle méthode pour récupérer les informations utilisateur depuis l'API
  fetchUserInfo(): Observable<any> {
    const userId = this.getUserId();
    if (!userId) {
      throw new Error('User ID non trouvé');
    }
    return this.getUserById(userId);
  }

  // Méthode pour sauvegarder les informations utilisateur
  saveUserInfo(userInfo: any): void {
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
  }

  // Méthode pour obtenir l'ID utilisateur depuis le token
  getUserId(): number | null {
    const token = this.getToken();
    if (!token) return null;
    
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      return decoded.user_id;
    } catch {
      return null;
    }
  }

  // Nouvelle méthode pour obtenir les informations utilisateur
  getUserInfo(): any {
    const storedUserInfo = localStorage.getItem('userInfo');
    if (storedUserInfo) {
      try {
        return JSON.parse(storedUserInfo);
      } catch {
        return null;
      }
    }

    // Fallback sur le token si pas d'infos stockées
    const token = this.getToken();
    if (!token) return null;
    
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      return {
        id: decoded.user_id,
        email: decoded.email || null,
        role: decoded.role || null
      };
    } catch {
      return null;
    }
  }

  // Redirection vers le dashboard approprié selon le rôle
  redirectToUserDashboard(): void {
    const role = this.getUserRole();
    const path = this.getCorrectPathForRole(role);
    this.router.navigate([path]);
  }

  // Obtenir le chemin correct selon le rôle
  getCorrectPathForRole(role: string | null): string {
    switch (role?.toLowerCase()) {
      case 'enseignant':
      case 'teacher':
        return '/enseignant';
      case 'technicien':
      case 'technician':
        return '/technicien';
      case 'responsable':
      case 'manager':
        return '/responsable';
      default:
        return '/login';
    }
  }

  // Méthodes existantes...
  getUserById(userId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.apiUrl}/users/users/${userId}/`, { headers });
  }

  updateUserProfile(userId: number, userData: FormData): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`
    });
    return this.http.patch<any>(`${this.apiUrl}/users/user/update/${userId}/`, userData, { headers });
  }

  requestPasswordReset(email: string): Observable<any> {
    const forgotPasswordUrl = `${this.passwordResetBaseUrl}/forgot-password/`;
    return this.http.post(forgotPasswordUrl, { email });
  }

  resetPassword(token: string, password: string): Observable<any> {
    const resetPasswordUrl = `${this.passwordResetBaseUrl}/${token}/`;
    return this.http.post(resetPasswordUrl, { password });
  }

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getToken()}`
    });
  }
}