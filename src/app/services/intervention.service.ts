import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Intervention } from '../models/Intervention';

@Injectable({
  providedIn: 'root'
})
export class InterventionService {
  // Utilisez l'URL de base de votre API
  private apiUrl = 'http://127.0.0.1:8000/api'; // Assurez-vous que c'est l'URL correcte

  constructor(private http: HttpClient) { }

  // Méthode pour obtenir le token JWT (vous devez implémenter cette logique)
  // Le token est généralement stocké dans le localStorage ou un service d'authentification après la connexion
  private getAuthToken(): string | null {
    // --- REMPLACER PAR VOTRE LOGIQUE RÉELLE pour récupérer le token JWT ---
    const token = localStorage.getItem('token'); // Exemple: récupérer du localStorage
    // console.log('Retrieved JWT Token for InterventionService:', token); // Debugging line
    return token;
    // --- END OF PLACEHOLDER ---
  }

  // Méthode pour créer les en-têtes avec le token d'authentification
  private getAuthHeaders(): HttpHeaders {
    const token = this.getAuthToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    // Note: Pour FormData, HttpClient définit automatiquement l'en-tête Content-Type approprié
    return headers;
  }


  /**
   * Crée une nouvelle intervention pour une réclamation
   * Cette méthode envoie les données du formulaire de rapport pour créer l'intervention initiale.
   * Elle nécessite l'authentification.
   */
  createIntervention(interventionData: FormData): Observable<Intervention> {
    // Inclure les en-têtes d'authentification
    return this.http.post<Intervention>(`${this.apiUrl}/interventions/`, interventionData, { headers: this.getAuthHeaders() });
  }

  /**
   * Met à jour une intervention existante (si nécessaire, nécessite authentification)
   */
  updateIntervention(interventionId: number, interventionData: any): Observable<Intervention> {
    // Inclure les en-têtes d'authentification
    return this.http.patch<Intervention>(`${this.apiUrl}/interventions/${interventionId}/`, interventionData, { headers: this.getAuthHeaders() });
  }

  /**
   * Génère un rapport PDF complet pour une intervention et finalise l'intervention
   * Cette méthode appelle l'endpoint qui met à jour l'intervention, la termine et génère le PDF.
   * Elle nécessite l'authentification.
   */
  completeInterventionReport(interventionId: number, reportData: FormData): Observable<Blob> {
    // Inclure les en-têtes d'authentification
    return this.http.post(`${this.apiUrl}/interventions/${interventionId}/complete-report/`, reportData, {
      headers: this.getAuthHeaders(), // Inclure les en-têtes d'authentification
      responseType: 'blob' // Expecting a file Blob response (the PDF)
    });
  }

  /**
   * Obtient les interventions associées à une réclamation (nécessite authentification)
   */
  getInterventionsByReclamation(reclamationId: number): Observable<Intervention[]> {
    // Inclure les en-têtes d'authentification
    return this.http.get<Intervention[]>(`${this.apiUrl}/interventions/?reclamation=${reclamationId}`, { headers: this.getAuthHeaders() });
  }

    /**
     * Obtient la liste des interventions pour un utilisateur spécifique.
     * Appelle l'endpoint backend /api/interventions/user/{user_id}/
     */
    getUserInterventions(userId: number): Observable<Intervention[]> {
        // Inclure les en-têtes d'authentification
        return this.http.get<Intervention[]>(`${this.apiUrl}/interventions/user/${userId}/`, { headers: this.getAuthHeaders() });
    }

    // Ajoutez d'autres méthodes si nécessaire, en incluant les en-têtes d'authentification
    // Exemple: obtenir une seule intervention
    getIntervention(interventionId: number): Observable<Intervention> {
        return this.http.get<Intervention>(`${this.apiUrl}/interventions/${interventionId}/`, { headers: this.getAuthHeaders() });
    }
}
