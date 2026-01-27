import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";

/**
 * PrivateRoute
 * - Protege rotas que exigem autenticação
 * - Critério: token (isAuthenticated)
 * - Não depende de `user` (porque ainda podemos não ter /users/me)
 */
export function PrivateRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Enquanto o AuthContext está a inicializar (ex: a ler token do storage)
  if (isLoading) {
    return (
      <div style={{ padding: 16, maxWidth: 800, margin: "40px auto" }}>
        <p style={{ margin: 0 }}>A validar sessão…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
