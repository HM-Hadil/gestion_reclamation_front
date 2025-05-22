import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { NewPasswordComponent } from './new-password/new-password.component';
import { DashbordTechComponent } from './dashbord-tech/dashbord-tech.component';
import { ResponsableComponent } from './responsable/responsable.component';
import { ProfilComponent } from './profil/profil.component';
import { CreateReclamationComponent } from './dashboard-enseignant/create-reclamation/create-reclamation.component';
import { MyReclamationsComponent } from './dashboard-enseignant/my-reclamations/my-reclamations.component';
import { FicheTechniqueComponent } from './dashboard-enseignant/fiche-technique/fiche-technique.component';
import { EnseignantComponent } from './dashboard-enseignant/enseignant/enseignant.component';
import { ListReclamationsAdminComponent } from './dashbord-tech/list-reclamations-admin/list-reclamations-admin.component';
import { CreateEquipementComponent } from './dashbord-tech/create-equipement/create-equipement.component';
import { MyInterventionsComponent } from './dashboard-enseignant/my-interventions/my-interventions.component';
import { ListOthersInterventionsComponent } from './dashboard-enseignant/list-others-interventions/list-others-interventions.component';
import { ResponasbleListInterventionsComponent } from './responsable/responasble-list-interventions/responasble-list-interventions.component';
import { ResponasbleListReclamationsComponent } from './responsable/responasble-list-reclamations/responasble-list-reclamations.component';
import { ResponasbleStatistiqueComponent } from './responsable/responasble-statistique/responasble-statistique.component';

import { authGuard, roleGuard } from './auth.guard';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'reset-password/:token', component: NewPasswordComponent },
  
  // Routes protégées avec auth guard et données de rôles
  { 
    path: 'profil', 
    component: ProfilComponent, 
    canActivate: [authGuard] 
  },

  { 
    path: 'enseignant', 
    component: EnseignantComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['enseignant', 'teacher'] },
    children: [
      { path: 'create-reclamation', component: CreateReclamationComponent },
      { path: 'my-reclamations', component: MyReclamationsComponent },
      { path: 'fiche-technique', component: FicheTechniqueComponent },
      { path: 'my-interventions', component: MyInterventionsComponent },
      { path: 'other-interventions', component: ListOthersInterventionsComponent },
      { path: '', redirectTo: 'create-reclamation', pathMatch: 'full' }
    ]
  },

  { 
    path: 'technicien', 
    component: DashbordTechComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['technicien', 'technician'] },
    children: [
      { path: 'list-reclamation-admin', component: ListReclamationsAdminComponent },
      { path: 'create-equipment', component: CreateEquipementComponent },
      { path: '', redirectTo: 'list-reclamation-admin', pathMatch: 'full' }
    ]
  },

  { 
    path: 'responsable', 
    component: ResponsableComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['responsable', 'manager'] },
    children: [
      { path: 'list-interventions', component: ResponasbleListInterventionsComponent },
      { path: 'list-reclamations', component: ResponasbleListReclamationsComponent },
      { path: 'statistique', component: ResponasbleStatistiqueComponent },
      { path: '', redirectTo: 'statistique', pathMatch: 'full' }
    ]
  },

  // Redirection par défaut
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }