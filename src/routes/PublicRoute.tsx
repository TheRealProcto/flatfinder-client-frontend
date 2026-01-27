import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";

/**
 * PublicRoute
 * - Só para páginas públicas (login/register)
 * - Se já estiver autenticado, redireciona para Home
 */
export function PublicRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ padding: 16, maxWidth: 800, margin: "40px auto" }}>
        <p style={{ margin: 0 }}>A validar sessão…</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
