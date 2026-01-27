import { api } from "./axios";

export const authApi = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),

  register: (data: any) =>
    api.post("/auth/register", data),
};
