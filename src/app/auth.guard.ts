// auth.guard.ts
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Vérifier si l'utilisateur est connecté
  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  // Obtenir le rôle de l'utilisateur
  const userRole = authService.getUserRole();
  
  // Vérifier si le rôle est défini
  if (!userRole) {
    router.navigate(['/login']);
    return false;
  }

  // Récupérer les rôles autorisés pour cette route (définis dans les données de la route)
  const allowedRoles = route.data?.['roles'] as string[];
  
  // Si aucun rôle spécifique n'est requis, autoriser l'accès
  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  // Vérifier si l'utilisateur a un rôle autorisé
  if (allowedRoles.includes(userRole)) {
    return true;
  }

  // Rediriger vers le dashboard approprié selon le rôle
  authService.redirectToUserDashboard();
  return false;
};

// role.guard.ts - Guard spécifique pour la redirection basée sur les rôles
export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  const userRole = authService.getUserRole();
  const currentPath = state.url;

  // Rediriger vers le bon dashboard si l'utilisateur accède à une route incorrecte
  const correctPath = authService.getCorrectPathForRole(userRole);
  
  if (currentPath !== correctPath && !currentPath.startsWith(correctPath)) {
    router.navigate([correctPath]);
    return false;
  }

  return true;
};