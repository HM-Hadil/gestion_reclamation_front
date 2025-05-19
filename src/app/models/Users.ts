export interface Users {
  
    first_name: string;
    last_name: string;
    email: string;
    password:string;
    role: 'responsable' | 'technicien' | 'enseignant';
}
