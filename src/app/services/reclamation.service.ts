// src/app/reclamation.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../auth.service'; // Assurez-vous que le chemin est correct
import {
  Reclamation,
  CreateReclamationRequest,
  ReclamationStats,
  AnalyseStatistique,
  ReclamationPCDetails,
  ReclamationElectriqueDetails,
  ReclamationDiversDetails
} from '../models/reclamation.model'; // Assurez-vous que le chemin est correct

@Injectable({
  providedIn: 'root'
})
export class ReclamationService {

  // URL de base de votre API Django (ajustez si nécessaire)
  private apiUrl = 'http://127.0.0.1:8000/api/reclamations'; // Endpoint plus spécifique pour les réclamations

  constructor(
    private http: HttpClient,
    private authService: AuthService // Service pour gérer l'authentification et le token JWT
  ) { }

  // --- Méthodes principales pour les réclamations ---

  /**
   * Crée une nouvelle réclamation.
   * Cette méthode envoie les données de la nouvelle réclamation au backend.
   * Le backend devrait associer automatiquement la réclamation à l'utilisateur connecté (via le token JWT).
   * @param data Les informations nécessaires pour créer la réclamation, y compris les détails spécifiques.
   * @returns Un Observable contenant la réclamation créée par le backend.
   */
  createReclamation(data: CreateReclamationRequest): Observable<Reclamation> {
    // L'URL '/create/' est plausible, mais souvent un POST sur l'URL de base de la ressource (`/api/reclamations/`) est utilisé en REST.
    // Je garde votre URL '/create/' pour l'instant, mais vérifiez votre configuration backend.
    // Alternative RESTful: return this.http.post<Reclamation>(`${this.apiUrl}/`, data, this.getHttpOptions())
    return this.http.post<Reclamation>(`${this.apiUrl}/create/`, data, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  /**
   * Récupère les détails complets d'une réclamation spécifique par son ID.
   * @param id L'identifiant unique de la réclamation à récupérer.
   * @returns Un Observable contenant la réclamation demandée avec tous ses détails (PC, Electrique ou Divers).
   */
  getReclamationById(id: number): Observable<Reclamation> {
    // Utilise une URL standard REST pour obtenir un objet par son ID.
    return this.http.get<Reclamation>(`${this.apiUrl}/${id}/`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  /**
   * Récupère la liste de toutes les réclamations soumises par l'utilisateur actuellement connecté.
   * Le backend doit filtrer les réclamations en se basant sur l'utilisateur identifié par le token JWT.
   * @returns Un Observable contenant un tableau des réclamations de l'utilisateur connecté.
   */
  getCurrentUserReclamations(): Observable<Reclamation[]> {
    // Endpoint pour récupérer les réclamations de l'utilisateur courant.
    // '/me/' ou '/my-reclamations/' sont des conventions courantes.
    // Si votre API filtre sur `${this.apiUrl}/` basé sur le token, c'est aussi possible.
    // Je propose un endpoint plus explicite, à adapter selon votre API.
    return this.http.get<Reclamation[]>(`${this.apiUrl}/me/`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
    // Si votre API utilise l'URL de base et filtre par token :
    // return this.http.get<Reclamation[]>(`${this.apiUrl}/`, this.getHttpOptions())
    //  .pipe(catchError(this.handleError));
  }

  /**
   * Récupère les réclamations d'un utilisateur spécifique (potentiellement pour un admin ou un responsable).
   * Nécessite que l'utilisateur connecté ait les permissions nécessaires.
   * @param userId L'identifiant de l'utilisateur dont on veut récupérer les réclamations.
   * @returns Un Observable contenant un tableau des réclamations de l'utilisateur spécifié.
   */
  getUserReclamationsById(userId: number): Observable<Reclamation[]> {
    // Endpoint REST pour obtenir les réclamations liées à un utilisateur spécifique.
    return this.http.get<Reclamation[]>(`${this.apiUrl}/user/${userId}/`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  /**
   * Met à jour une réclamation existante (partiellement).
   * Permet de modifier par exemple le statut ou la description.
   * @param id L'ID de la réclamation à mettre à jour.
   * @param data Un objet contenant les champs à modifier.
   * @returns Un Observable contenant la réclamation mise à jour.
   */
  updateReclamation(id: number, data: Partial<CreateReclamationRequest>): Observable<Reclamation> {
    // Utilise PATCH pour une mise à jour partielle.
    return this.http.patch<Reclamation>(`${this.apiUrl}/${id}/`, data, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  /**
   * Supprime une réclamation.
   * @param id L'ID de la réclamation à supprimer.
   * @returns Un Observable vide (void) si la suppression réussit.
   */
  deleteReclamation(id: number): Observable<void> {
    // L'URL `/delete/{id}/` est possible, mais DELETE sur `/{id}/` est plus standard en REST.
    // Je garde votre URL pour l'instant.
    // Alternative RESTful: return this.http.delete<void>(`${this.apiUrl}/${id}/`, this.getHttpOptions())
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}/`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }


  // --- Méthodes pour les détails spécifiques (PC, Electrique, Divers) ---
  // Ces méthodes semblent interagir avec des endpoints séparés pour les détails.
  // Cela dépend de la conception de votre API (si les détails sont des modèles liés ou intégrés).
  // Le code fourni gère la création (POST) ou la mise à jour (PATCH) dans la même fonction.

  /**
   * Crée ou met à jour les détails spécifiques pour une réclamation de type PC.
   * @param reclamationId L'ID de la réclamation parente.
   * @param details Les détails PC à créer ou mettre à jour. Doit contenir `reclamationId` pour la création.
   * @returns Un Observable contenant les détails PC créés ou mis à jour.
   */
  savePCDetails(reclamationId: number, details: ReclamationPCDetails): Observable<ReclamationPCDetails> {
    // L'URL fournie pointe vers un 'viewset', typique de Django Rest Framework.
    const urlBase = `${this.apiUrl.replace('/reclamations', '/api')}/viewsets/reclamations-pc`; // Ajustez l'URL de base des viewsets si nécessaire

    if (details.id) {
      // Mise à jour (PATCH) si les détails ont déjà un ID
      return this.http.patch<ReclamationPCDetails>(`${urlBase}/${details.id}/`, details, this.getHttpOptions())
        .pipe(catchError(this.handleError));
    } else {
      // Création (POST) si pas d'ID. Assigne l'ID de la réclamation parente.
      details.reclamation = reclamationId; // Important pour lier les détails à la réclamation
      return this.http.post<ReclamationPCDetails>(`${urlBase}/`, details, this.getHttpOptions())
        .pipe(catchError(this.handleError));
    }
  }

  /**
   * Crée ou met à jour les détails spécifiques pour une réclamation de type Electrique.
   * @param reclamationId L'ID de la réclamation parente.
   * @param details Les détails Electrique à créer ou mettre à jour.
   * @returns Un Observable contenant les détails Electrique créés ou mis à jour.
   */
  saveElectriqueDetails(reclamationId: number, details: ReclamationElectriqueDetails): Observable<ReclamationElectriqueDetails> {
    const urlBase = `${this.apiUrl.replace('/reclamations', '/api')}/viewsets/reclamations-electrique`; // Ajustez l'URL

    if (details.id) {
      return this.http.patch<ReclamationElectriqueDetails>(`${urlBase}/${details.id}/`, details, this.getHttpOptions())
        .pipe(catchError(this.handleError));
    } else {
      details.reclamation = reclamationId;
      return this.http.post<ReclamationElectriqueDetails>(`${urlBase}/`, details, this.getHttpOptions())
        .pipe(catchError(this.handleError));
    }
  }

  /**
   * Crée ou met à jour les détails spécifiques pour une réclamation de type Divers.
   * @param reclamationId L'ID de la réclamation parente.
   * @param details Les détails Divers à créer ou mettre à jour.
   * @returns Un Observable contenant les détails Divers créés ou mis à jour.
   */
  saveDiversDetails(reclamationId: number, details: ReclamationDiversDetails): Observable<ReclamationDiversDetails> {
    const urlBase = `${this.apiUrl.replace('/reclamations', '/api')}/viewsets/reclamations-divers`; // Ajustez l'URL

    if (details.id) {
      return this.http.patch<ReclamationDiversDetails>(`${urlBase}/${details.id}/`, details, this.getHttpOptions())
        .pipe(catchError(this.handleError));
    } else {
      details.reclamation = reclamationId;
      return this.http.post<ReclamationDiversDetails>(`${urlBase}/`, details, this.getHttpOptions())
        .pipe(catchError(this.handleError));
    }
  }


  // --- Autres méthodes (Filtrage, Statistiques, Statut) ---
  // Celles-ci semblent correctes, mais dépendent fortement de votre API backend.

  /**
   * Récupère les réclamations filtrées par différents critères.
   */
  filterReclamations(
    lieu?: string,
    category?: 'pc' | 'electrique' | 'divers',
    statut?: 'en_attente' | 'en_cours' | 'termine'
  ): Observable<Reclamation[]> {
    let params = new HttpParams();
    if (lieu) params = params.set('lieu', lieu);
    if (category) params = params.set('category', category);
    if (statut) params = params.set('statut', statut);

    // Assurez-vous que l'endpoint `/filter/` existe sur votre API
    return this.http.get<Reclamation[]>(`${this.apiUrl}/filter/`, {
      ...this.getHttpOptions(),
      params
    }).pipe(catchError(this.handleError));
  }
   AllfilterdReclamations(
    lieu?: string,
    category?: 'pc' | 'electrique' | 'divers',
    statut?: 'en_attente' | 'en_cours' | 'termine'
  ): Observable<Reclamation[]> {
    let params = new HttpParams();
    if (lieu) params = params.set('lieu', lieu);
    if (category) params = params.set('category', category);
    if (statut) params = params.set('statut', statut);

    // Assurez-vous que l'endpoint `/filter/` existe sur votre API
    return this.http.get<Reclamation[]>(`${this.apiUrl}/reclamations/all_filtered/`, {
      ...this.getHttpOptions(),
      params
    }).pipe(catchError(this.handleError));
  }

  /**
   * Récupère les statistiques générales sur les réclamations (pour l'utilisateur connecté ou globales selon l'API).
   */
  getReclamationStatistics(): Observable<ReclamationStats> {
    // Assurez-vous que l'endpoint `/statistics/` existe
    return this.http.get<ReclamationStats>(`${this.apiUrl}/statistics/`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  /**
   * Récupère des statistiques d'analyse avancées.
   */
  getAnalyseStatistique(
    mois: number = 12,
    laboratoireId?: number,
    category?: string
  ): Observable<AnalyseStatistique> {
    let params = new HttpParams().set('mois', mois.toString());
    if (laboratoireId) params = params.set('laboratoire_id', laboratoireId.toString());
    if (category) params = params.set('category', category);

    // Assurez-vous que l'endpoint `/analyse-statistique/` existe
    return this.http.get<AnalyseStatistique>(`${this.apiUrl}/analyse-statistique/`, {
      ...this.getHttpOptions(),
      params
    }).pipe(catchError(this.handleError));
  }

  // --- Méthodes pour réclamations par statut (Exemples) ---

  getReclamationsEnAttente(): Observable<Reclamation[]> {
    // Assurez-vous que l'endpoint `/status/en-attente/` existe
    return this.http.get<Reclamation[]>(`${this.apiUrl}/status/en-attente/`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  // Ajoutez ici getReclamationsEnCours, getReclamationsTerminees si nécessaire...

  // --- Helpers Internes ---

  /**
   * Prépare les options HTTP, notamment en ajoutant le header d'authentification JWT.
   * @returns Un objet contenant les headers HTTP nécessaires pour les requêtes authentifiées.
   */
  private getHttpOptions() {
    const token = this.authService.getToken(); // Récupère le token depuis AuthService
    let headers = new HttpHeaders({
      'Content-Type': 'application/json', // Définit le type de contenu envoyé
    });

    if (token) {
      // Ajoute le token dans le header Authorization si l'utilisateur est connecté
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return { headers: headers };
  }

  /**
   * Gère les erreurs survenues lors des appels HTTP.
   * @param error L'objet HttpErrorResponse contenant les détails de l'erreur.
   * @returns Un Observable qui émet une nouvelle Erreur avec un message formaté.
   */
  private handleError(error: HttpErrorResponse) {
    console.error('Une erreur API est survenue:', error); // Log l'erreur complète pour le débogage

    let errorMessage = 'Une erreur inconnue est survenue lors de la communication avec le serveur.';

    if (error.error instanceof ErrorEvent) {
      // Erreur côté client ou réseau
      errorMessage = `Erreur réseau ou client : ${error.error.message}`;
    } else {
      // Erreur retournée par le backend (status code non 2xx)
      // Essaye d'extraire un message d'erreur spécifique du corps de la réponse
      const backendError = error.error;
      let detailMessage = '';

      if (backendError) {
        if (typeof backendError === 'string') {
          detailMessage = backendError;
        } else if (backendError.detail) {
          detailMessage = backendError.detail;
        } else if (backendError.error) {
          detailMessage = backendError.error;
        } else if (backendError.message) {
            detailMessage = backendError.message;
        } else if (typeof backendError === 'object') {
            // Si l'erreur est un objet (ex: erreurs de validation DRF)
            try {
              detailMessage = Object.entries(backendError)
                                    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                                    .join('; ');
            } catch (e) {
                // fallback
            }
        }
      }


      errorMessage = `Erreur ${error.status}: ${detailMessage || error.message || 'Erreur du serveur'}`;

      // Gérer spécifiquement les erreurs d'authentification (optionnel mais recommandé)
      if (error.status === 401 || error.status === 403) {
        errorMessage = `Erreur ${error.status}: Authentification refusée. ${detailMessage || 'Vérifiez vos identifiants ou permissions.'}`;
        // Potentiellement déconnecter l'utilisateur ou le rediriger vers la page de login
        // this.authService.logout();
        // window.location.reload(); // ou redirection via Router
      }
    }

    // Retourne un Observable qui échoue immédiatement avec l'erreur formatée
    return throwError(() => new Error(errorMessage));
  }
}