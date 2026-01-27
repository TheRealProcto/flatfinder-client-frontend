import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { authApi } from "../api/auth.api";
import { api } from "../api/axios";
import { tokenService } from "../services/token.service";

/**
 * Tipos base do utilizador.
 * Ajusta estes campos ao que o teu backend realmente devolve.
 */
export type AuthUser = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  birthDate?: string; // ISO string (ex: "1992-07-06")
  isAdmin?: boolean;
};

/**
 * Estrutura do contexto de autenticação.
 * Tudo o que a app precisa para:
 * - saber se o user está autenticado
 * - saber quem é
 * - fazer login/logout/register
 */
export type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  logout: () => void;

  /**
   * Útil quando queres "confirmar sessão" ao arrancar,
   * ou depois de atualizares o perfil e queres atualizar o user no contexto.
   */
  refreshMe: () => Promise<void>;
};

/**
 * Payload de registo (frontend).
 * Ajusta campos conforme o teu backend espera.
 */
export type RegisterPayload = {
  email: string;
  password: string;
  confirmPassword?: string; // opcional: front valida, backend pode ignorar
  firstName: string;
  lastName: string;
  birthDate: string; // ISO string (ex: "1992-07-06")
};

/**
 * Resposta típica de login/register.
 * - { token: "..." }
 * - { accessToken: "..." }
 * - { token: "...", user: {...} }
 */
type AuthResponse = {
  success?: boolean;
  data?: {
    token?: string;
    user?: AuthUser;
  };
  // compatibilidade futura
  token?: string;
  accessToken?: string;
  user?: AuthUser;
};

export const AuthContext = createContext<AuthContextType | null>(null);

/**
 * AuthProvider: envolve a aplicação e disponibiliza o AuthContext.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(tokenService.get());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isAuthenticated = !!token;

  /**
   * Ajuda a normalizar o token vindo do backend
   */
  const extractToken = (payload: AuthResponse): string | null => {
  return payload?.data?.token ?? payload?.token ?? payload?.accessToken ?? null;
};

  /**
   * Guarda token de forma consistente (state + localStorage).
   */
  const persistToken = (newToken: string | null) => {
    setToken(newToken);

    if (newToken) tokenService.set(newToken);
    else tokenService.remove();
  };

  /**
   * Opcional mas recomendado: endpoint /users/me (ou parecido)
   * para obter o user a partir do token.
   *
   * ⚠️ Se o teu backend ainda não tem /users/me, diz-me:
   * - ou criamos isso no backend (recomendado)
   * - ou devolvemos o user no login/register (menos flexível)
   */
  const refreshMe = useCallback(async () => {
    const currentToken = tokenService.get();
    if (!currentToken) {
      setUser(null);
      return;
    }

    try {
      // Ajusta o endpoint conforme o teu backend:
      // exemplos comuns: "/users/me" ou "/users/profile"
      const res = await api.get<AuthUser>("/users/me");
      setUser(res.data);
    } catch (err: any) {
  const status = err?.response?.status;

  // ✅ Se ainda não existe /users/me (404), não vamos destruir sessão
  if (status === 404) {
    console.warn("Endpoint /users/me não existe (ainda). A manter token.");
    setUser(null);
    return;
  }

  // Se for 401/403, então sim: token inválido -> limpar sessão
  if (status === 401 || status === 403) {
    persistToken(null);
    setUser(null);
  }

  throw err;
}
  }, []);

  /**
   * Login:
   * 1) chama /users/login
   * 2) guarda token
   * 3) define user (se vier no response) OU faz refreshMe()
   */
  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);

    try {
      const res = await authApi.login(email, password);
      const payload = res.data as AuthResponse;

      const newToken = extractToken(payload);
if (!newToken) {
  console.error("Resposta inesperada no login:", payload);
  throw new Error("Login falhou: o servidor não devolveu token.");
}

persistToken(newToken);

// ✅ user pode vir dentro de payload.data.user
const nextUser = payload?.data?.user ?? payload?.user ?? null;

if (nextUser) {
  setUser(nextUser);
} else {
  // Sem /users/me, não conseguimos ir buscar user
  // Mantemos autenticado com token e user fica null por agora
  setUser(null);
}
    } finally {
      setIsLoading(false);
    }
  }, [refreshMe]);

  /**
   * Register:
   * Normalmente faz:
   * 1) chama /users/register
   * 2) guarda token (se vier) e entra logo
   *
   * Se o teu backend apenas criar e não autenticar,
   * podemos ajustar para: register -> depois login automaticamente.
   */
  const register = useCallback(async (data: RegisterPayload) => {
    setIsLoading(true);

    try {
      // Se estás a usar confirmPassword no frontend, podes validar antes:
      if (data.confirmPassword && data.confirmPassword !== data.password) {
        throw new Error("As passwords não coincidem.");
      }

      const res = await authApi.register(data);
      const payload = res.data as AuthResponse;

      const newToken = extractToken(payload);

      // Caso o backend já autentique após registo
      if (newToken) {
        persistToken(newToken);

  const nextUser = payload?.data?.user ?? payload?.user ?? null;
  if (nextUser) setUser(nextUser);
  else setUser(null);

        return;
      }

      // Caso o backend NÃO autentique após registo:
      // fazemos login automaticamente (opcional e confortável para UX)
      await login(data.email, data.password);
    } finally {
      setIsLoading(false);
    }
  }, [login, refreshMe]);

  /**
   * Logout: limpa token + user.
   */
  const logout = useCallback(() => {
    persistToken(null);
    setUser(null);
  }, []);

  /**
   * Ao arrancar a app:
   * - se houver token guardado, tentamos obter o user (refreshMe)
   * - senão, terminamos loading
   */
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        if (tokenService.get()) {
  // Sem /users/me, não dá para reconstruir o user.
  // Mantemos o token (autenticado) e user fica null.
  setUser(null);
}
      } catch {
        // Já tratamos invalid token dentro do refreshMe
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [refreshMe]);

  /**
   * memo para evitar re-renders desnecessários
   */
  const value = useMemo<AuthContextType>(() => {
    return {
      user,
      token,
      isAuthenticated,
      isLoading,
      login,
      register,
      logout,
      refreshMe,
    };
  }, [user, token, isAuthenticated, isLoading, login, register, logout, refreshMe]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
