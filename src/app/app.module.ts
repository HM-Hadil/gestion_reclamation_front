import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

import { HttpClientModule } from '@angular/common/http';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxDropzoneModule } from 'ngx-dropzone';
import { LoginComponent } from './login/login.component';
import { NavbarComponent } from './navbar/navbar.component';
import { FooterComponent } from './footer/footer.component';
import { RegisterComponent } from './register/register.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { NewPasswordComponent } from './new-password/new-password.component';
import { DashbordTechComponent } from './dashbord-tech/dashbord-tech.component';
import { ResponsableComponent } from './responsable/responsable.component';
import { ProfilComponent } from './profil/profil.component';
import { CreateReclamationComponent } from './dashboard-enseignant/create-reclamation/create-reclamation.component';
import { MyReclamationsComponent } from './dashboard-enseignant/my-reclamations/my-reclamations.component';
import { FicheTechniqueComponent } from './dashboard-enseignant/fiche-technique/fiche-technique.component';
import { RouterOutlet } from '@angular/router';
import { EnseignantComponent } from './dashboard-enseignant/enseignant/enseignant.component';
import { ListReclamationsAdminComponent } from './dashbord-tech/list-reclamations-admin/list-reclamations-admin.component';
import { CreateEquipementComponent } from './dashbord-tech/create-equipement/create-equipement.component';
import { MyInterventionsComponent } from './dashboard-enseignant/my-interventions/my-interventions.component';
import { ListOthersInterventionsComponent } from './dashboard-enseignant/list-others-interventions/list-others-interventions.component';
import { ResponasbleListInterventionsComponent } from './responsable/responasble-list-interventions/responasble-list-interventions.component';
import { ResponasbleListReclamationsComponent } from './responsable/responasble-list-reclamations/responasble-list-reclamations.component';
import { ResponasbleStatistiqueComponent } from './responsable/responasble-statistique/responasble-statistique.component';





@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    NavbarComponent,
    FooterComponent,
    RegisterComponent,
    EnseignantComponent,
    ForgotPasswordComponent,
    NewPasswordComponent,
    DashbordTechComponent,
    ResponsableComponent,
    ProfilComponent,
    CreateReclamationComponent,
    MyReclamationsComponent,
    FicheTechniqueComponent,
    ListReclamationsAdminComponent,
    CreateEquipementComponent,
    MyInterventionsComponent,
    ListOthersInterventionsComponent,
    ResponasbleListInterventionsComponent,
    ResponasbleListReclamationsComponent,
    ResponasbleStatistiqueComponent,
    
 
  ],
  imports: [
    
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    NgxDropzoneModule,
    RouterOutlet
  
   
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
