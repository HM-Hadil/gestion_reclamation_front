import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { NewPasswordComponent } from './new-password/new-password.component';
import { EnseignantComponent } from './enseignant/enseignant.component';
import { DashbordTechComponent } from './dashbord-tech/dashbord-tech.component';


const routes: Routes = [

{ path: '', component: HomeComponent },
{ path: 'login', component: LoginComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'register', component: RegisterComponent }, // Vérifie qu'il n'y a pas d'erreur ici
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'new-password', component: NewPasswordComponent },
  { path: 'enseignant', component: EnseignantComponent },
  { path: 'technicien', component: DashbordTechComponent },


];

@NgModule({
  declarations: [],
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
