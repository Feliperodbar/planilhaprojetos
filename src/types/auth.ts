export type UserRole = "user" | "admin";

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface SessionState {
  user: SessionUser;
}
