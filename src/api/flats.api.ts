import { api } from "./axios";

export type FlatPayload = {
  city: string;
  streetName: string;
  streetNumber: string; // ✅ string (como no backend)
  areaSize: number;
  hasAC: boolean;
  yearBuilt: number;
  rentPrice: number;
  dateAvailable: string; // yyyy-mm-dd (frontend)
};

export type Flat = {
  id: number;
  city: string;
  streetName: string;
  streetNumber: string;
  areaSize: number;
  hasAC: boolean;
  yearBuilt: number;
  rentPrice: number;
  dateAvailable: string; // ISO no backend
  ownerId: number;
  createdAt: string;
  updatedAt: string;
};

export type FlatsMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  sort: string;
  filters: Record<string, any>;
};

export type FlatsListResponse = {
  success: boolean;
  data: {
    flats: Flat[];
    meta: FlatsMeta;
  };
};

export type FlatResponse = {
  success: boolean;
  data: Flat;
};

export type FlatsGetAllParams = {
  page?: number;
  limit?: number;
  sort?: string;

  city?: string;

  minPrice?: number;
  maxPrice?: number;

  minArea?: number;

  hasAC?: boolean; // axios vai serializar como true/false -> backend aceita "true"/"false"
  availableFrom?: string; // "YYYY-MM-DD"
  ownerId?: number;
};

export const flatsApi = {
  getAll: (params?: FlatsGetAllParams) => api.get("/flats", { params }),
  getById: (id: number) => api.get(`/flats/${id}`),

  create: (data: any) => api.post("/flats", data),
  update: (id: number, data: any) => api.patch(`/flats/${id}`, data),
  remove: (id: number) => api.delete(`/flats/${id}`),
};