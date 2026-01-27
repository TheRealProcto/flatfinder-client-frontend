import { api } from "./axios";
import type { Flat } from "./flats.api";

export type FavouritesListResponse = {
  success: boolean;
  data: {
    flats: Flat[];
  };
};

export type FavouriteActionResponse = {
  success: boolean;
  data?: { message: string };
  error?: { message: string; code: string };
};

export const favouritesApi = {
  getMine: () => api.get<FavouritesListResponse>("/users/me/favourites"),

  add: (flatId: number) =>
    api.post<FavouriteActionResponse>(`/users/me/favourites/${flatId}`),

  remove: (flatId: number) =>
    api.delete<FavouriteActionResponse>(`/users/me/favourites/${flatId}`),
};
