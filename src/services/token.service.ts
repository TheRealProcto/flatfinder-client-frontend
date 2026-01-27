export const tokenService = {
  get: () => localStorage.getItem("token"),
  set: (token: string) => localStorage.setItem("token", token),
  remove: () => localStorage.removeItem("token"),
};
