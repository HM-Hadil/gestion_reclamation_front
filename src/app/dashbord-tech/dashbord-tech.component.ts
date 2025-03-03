import { Component } from '@angular/core';

@Component({
  selector: 'app-dashbord-tech',
  templateUrl: './dashbord-tech.component.html',
  styleUrls: ['./dashbord-tech.component.css']
})
export class DashbordTechComponent {
    // Variable pour contrôler l'affichage de la liste déroulante
    isFilterDropdownVisible = false;

    // Fonction pour alterner la visibilité de la liste déroulante
    toggleFilterDropdown() {
      this.isFilterDropdownVisible = !this.isFilterDropdownVisible;
    }
  tasks = [
    { id: 'FIG-123', title: 'Task 1', priority: 'High', date: 'Dec 5', type: 'Bug' },
    { id: 'FIG-122', title: 'Task 2', priority: 'Low', date: 'Dec 5', type: 'Feature' },
  ];
  statuses = ['Open', 'In Progress', 'Closed'];
}