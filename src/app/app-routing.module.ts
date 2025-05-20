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


const routes: Routes = [

{ path: '', component: HomeComponent },
{ path: 'login', component: LoginComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'register', component: RegisterComponent }, // Vérifie qu'il n'y a pas d'erreur ici
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'reset-password/:token', component: NewPasswordComponent },
  { path: 'profil', component: ProfilComponent },


{ path: 'enseignant', component: EnseignantComponent ,children:[
{path:'create-reclamation',component:CreateReclamationComponent},
{path:'my-reclamations',component:MyReclamationsComponent},
{path:'fiche-technique',component:FicheTechniqueComponent},
{ path: 'my-interventions', component: MyInterventionsComponent },
{path:'other-interventions',component:ListOthersInterventionsComponent},
]},

    { path: 'technicien', component: DashbordTechComponent,
    children:[
    {path:'list-reclamation-admin',component:ListReclamationsAdminComponent},
    {path:'create-equipment',component:CreateEquipementComponent}

    ]
   },
  { path: 'responsable', component: ResponsableComponent ,
    children:[
      {path:'list-interventions',component:ResponasbleListInterventionsComponent},
      {path:'list-reclamations',component:ResponasbleListReclamationsComponent},
      {path:'statistique',component:ResponasbleStatistiqueComponent}

    ]
  },




];

@NgModule({
  declarations: [],
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
