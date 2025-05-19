export interface UserProfile {
    id: number | null;
    firstName: string;
    lastName: string;
    email?: string;
    role?: string;
    image: string | null;
  }