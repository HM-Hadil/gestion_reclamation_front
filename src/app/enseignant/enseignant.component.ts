import { Component } from '@angular/core';

@Component({
  selector: 'app-enseignant',
  templateUrl: './enseignant.component.html',
  styleUrls: ['./enseignant.component.css']
})
export class EnseignantComponent {
  formVisible = false;
  selectedLocation: string = '';
  numeroLocal: string = '';
  selectedCategory: string = '';
  selectedPC: string = '';
  newPC: string = '';
  selectedProblemType: string = '';
  selectedProblem: string = '';
  newProblem: string = '';
  showAddProblemInput = false;

  // Listes des problèmes
  pcList = ["PC1", "PC2", "PC3"];
  materielProblems = ["Clavier", "Souris", "Affichage", "Imprimante", "Scanner", "Carte réseau"];
  logicielProblems = ["Connexion internet", "Système d'exploitation", "Antivirus", "Installation de logiciel"];
  electriqueProblems = ["Climatiseur", "Coupure de courant"];
  diversProblems = ["Tableau blanc", "Vidéo projecteur"];
  reclamations = [
    {
      task: "Problème d'affichage écran",
      status: "validée"
    },
    {
      task: "Ordinateur ne démarre pas",
      status: "en attente"
    }
  ];

  afficherFormulaire() {
    this.formVisible = true;
  }

  annulerFormulaire() {
    this.formVisible = false;
    this.resetForm();
  }

  resetForm() {
    this.selectedLocation = '';
    this.numeroLocal = '';
    this.selectedCategory = '';
    this.selectedPC = '';
    this.newPC = '';
    this.selectedProblemType = '';
    this.selectedProblem = '';
    this.newProblem = '';
    this.showAddProblemInput = false;
  }

  addNewPC() {
    if (this.newPC.trim()) {
      this.pcList.push(this.newPC);
      this.selectedPC = this.newPC;
      this.newPC = '';
    }
  }

  addNewProblem() {
    if (this.newProblem.trim()) {
      if (this.selectedProblemType === 'Matériel') {
        this.materielProblems.push(this.newProblem);
      } else if (this.selectedProblemType === 'Logiciel') {
        this.logicielProblems.push(this.newProblem);
      } else if (this.selectedCategory === 'Électrique' || this.selectedLocation === 'Bureau') {
        this.electriqueProblems.push(this.newProblem);
      } else if (this.selectedCategory === 'Divers') {
        this.diversProblems.push(this.newProblem);
      }
      this.selectedProblem = this.newProblem;
      this.newProblem = '';
      this.showAddProblemInput = false;
    }
  }

  canSubmit(): boolean {
    return this.selectedLocation !== '' && this.numeroLocal.trim() !== '';
  }

  // Réinitialiser les informations selon le lieu sélectionné
  resetLocationData() {
    if (this.selectedLocation === 'Salle' || this.selectedLocation === 'Bureau') {
      this.selectedCategory = '';
      this.selectedPC = '';
      this.showAddProblemInput = false;
    }
  }
  resetStep(step: string) {
    switch (step) {
        case 'category':
            this.selectedCategory = '';
            this.selectedPC = '';
            this.selectedProblemType = '';
            this.selectedProblem = '';
            break;
        case 'pc':
            this.selectedPC = '';
            this.selectedProblemType = '';
            this.selectedProblem = '';
            break;
        case 'problemType':
            this.selectedProblemType = '';
            this.selectedProblem = '';
            break;
        case 'problem':
            this.selectedProblem = '';
            break;
    }
}










}
