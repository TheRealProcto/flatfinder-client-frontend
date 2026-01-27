import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";

/**
 * AdminRoute
 * - Só permite acesso a utilizadores autenticados e com isAdmin = true
 * - Se não estiver autenticado -> /login
 * - Se estiver autenticado mas não for admin -> /
 */
export function AdminRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Enquanto estamos a confirmar a sessão (refreshMe), não fazemos redirects
  if (isLoading) {
    return (
      <div className="container" style={{ paddingTop: 24 }}>
        <p className="p">A validar sessão…</p>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // ⚠️ Garante que user já vem preenchido pelo refreshMe/login
  if (!user?.isAdmin) return <Navigate to="/" replace />;

  return <Outlet />;
}
