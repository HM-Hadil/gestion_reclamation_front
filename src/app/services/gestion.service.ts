// src/app/gestion.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../auth.service';
import { Laboratoire, LaboratoireData, PC, PCData, Salle, Bureau } from '../models/gestion.model';

@Injectable({
  providedIn: 'root'
})
export class GestionService {

  private apiUrl = 'http://127.0.0.1:8000/api'; // Base URL de votre API Django

  constructor(
    private http: HttpClient,
    private authService: AuthService // Injectez si nécessaire
  ) { }

  // --- Méthodes pour Laboratoires ---

  getLaboratoires(): Observable<Laboratoire[]> {
    return this.http.get<Laboratoire[]>(`${this.apiUrl}/laboratoires/`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  getLaboratoireById(id: number): Observable<Laboratoire> {
    return this.http.get<Laboratoire>(`${this.apiUrl}/laboratoires/${id}/`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  createLaboratoire(data: LaboratoireData): Observable<Laboratoire> {
    return this.http.post<Laboratoire>(`${this.apiUrl}/laboratoires/`, data, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  updateLaboratoire(id: number, data: Partial<LaboratoireData>): Observable<Laboratoire> {
    // Utiliser PATCH pour les mises à jour partielles
    return this.http.patch<Laboratoire>(`${this.apiUrl}/laboratoires/${id}/`, data, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  deleteLaboratoire(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/laboratoires/${id}/`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  // --- Méthodes pour PCs (Postes) ---

  // Récupérer les PCs pour un laboratoire spécifique
  getPCsByLaboratoire(laboratoireId: number): Observable<PC[]> {
    return this.http.get<PC[]>(`${this.apiUrl}/laboratoires/${laboratoireId}/pcs/`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

   // Récupérer tous les PCs (moins utilisé si on filtre par labo)
   getAllPCs(): Observable<PC[]> {
    return this.http.get<PC[]>(`${this.apiUrl}/pc/`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }


  getPCById(id: number): Observable<PC> {
    return this.http.get<PC>(`${this.apiUrl}/pc/${id}/`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  createPC(data: PCData): Observable<PC> {
    // Assurez-vous que data.laboratoire contient l'ID du labo
    if (!data.laboratoire) {
        return throwError(() => new Error('L\'ID du laboratoire est requis pour créer un PC.'));
    }
    return this.http.post<PC>(`${this.apiUrl}/pc/`, data, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  updatePC(id: number, data: Partial<PCData>): Observable<PC> {
    return this.http.patch<PC>(`${this.apiUrl}/pc/${id}/`, data, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  deletePC(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/pc/${id}/`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  // --- Méthodes pour Salles (Exemple) ---
  getSalles(): Observable<Salle[]> {
    return this.http.get<Salle[]>(`${this.apiUrl}/salles/`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }
  // Ajouter create/update/delete pour Salles si nécessaire

  // --- Méthodes pour Bureaux (Exemple) ---
   getBureaux(): Observable<Bureau[]> {
    return this.http.get<Bureau[]>(`${this.apiUrl}/bureaux/`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }
  // Ajouter create/update/delete pour Bureaux si nécessaire


  // --- Helper pour les options HTTP (gestion de l'authentification) ---
  private getHttpOptions() {
    const token = this.authService.getToken(); // Récupère le token (peut être null)
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    // Ajoute l'en-tête Authorization si un token existe
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
      console.log('token',token)
    }
    return { headers: headers };
  }

  // --- Gestionnaire d'erreurs HTTP ---
  private handleError(error: HttpErrorResponse) {
    console.error('Une erreur API est survenue:', error);
    let errorMessage = 'Une erreur inconnue est survenue.';
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client ou réseau
      errorMessage = `Erreur : ${error.error.message}`;
    } else {
      // Erreur retournée par le backend
      errorMessage = `Erreur ${error.status}: ${error.error?.detail || error.error?.error || error.message}`;
      // Vous pouvez ajouter une gestion plus spécifique des codes d'erreur ici (401, 403, 404, 500...)
    }
    return throwError(() => new Error(errorMessage));
  }
}