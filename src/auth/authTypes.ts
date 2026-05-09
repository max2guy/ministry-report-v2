export type UserRole = "reporter" | "admin";

export type AccountStatus = "active" | "mustChangePassword";

export type Account = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  passwordSalt: string;
  passwordHash: string;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
};
