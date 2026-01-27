/**
 * Formato padrão das respostas do backend
 */
export type ApiResponse<T> = {
  success: boolean;
  data: T;
};

/**
 * Listagem paginada de flats:
 * data: { flats: [...], meta: {...} }
 */
export type PaginatedResponse<TItem> = {
  flats: TItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    sort?: string;
    filters?: Record<string, any>;
  };
};