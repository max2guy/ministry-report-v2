export type UserRole = "reporter" | "admin";

export type Account = {
  id: string;          // Firebase uid
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};
