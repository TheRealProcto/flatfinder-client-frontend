import { api } from "./axios";

/**
 * Tipagem mínima para gestão de utilizadores no admin.
 * Ajusta campos conforme o teu backend devolve.
 */
export type AdminUser = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  birthDate?: string;
  isAdmin: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type UsersListResponse = {
  success: boolean;
  data: {
    users: AdminUser[];
    meta?: any; // se tiveres paginação, tipamos depois
  };
};

type UserResponse = {
  success: boolean;
  data: AdminUser | { user: AdminUser };
};

/**
 * usersApi (admin)
 * - endpoints sugeridos:
 *   GET    /admin/users
 *   PATCH  /admin/users/:id
 *   DELETE /admin/users/:id
 */
export const usersApi = {
  list: () => api.get<UsersListResponse>("/admin/users"),

  update: (id: number, data: Partial<Pick<AdminUser, "isAdmin">>) =>
    api.patch<UserResponse>(`/admin/users/${id}`, data),

  remove: (id: number) => api.delete<void>(`/admin/users/${id}`),
};
