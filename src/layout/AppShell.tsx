import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";

/**
 * AppShell
 * - Layout comum a todas as páginas privadas
 * - Sidebar/nav com links úteis
 * - Mostra link Admin só se user.isAdmin === true
 */
export default function AppShell() {
  const { user, logout } = useAuth();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `navlink ${isActive ? "navlink--active" : ""}`;

  return (
    <div className="shell">
      <aside className="shell__sidebar">
        <div className="shell__brand">
          <div className="shell__brandTitle">FlatFinder</div>
          <div className="shell__brandSub">
            Olá{user ? `, ${user.firstName}` : ""} 👋
          </div>
        </div>

        <nav className="shell__nav">
          <NavLink to="/" className={linkClass}>
            Home <span style={{ opacity: 0.6, fontWeight: 900 }}>→</span>
          </NavLink>

          <NavLink to="/flats/new" className={linkClass}>
            Novo flat <span style={{ opacity: 0.6, fontWeight: 900 }}>＋</span>
          </NavLink>

          <NavLink to="/favourites" className={linkClass}>
            Favoritos <span style={{ opacity: 0.6, fontWeight: 900 }}>♥</span>
            </NavLink>

            <NavLink to="/messages" className={linkClass}>
  Mensagens <span style={{ opacity: 0.6, fontWeight: 900 }}>✉</span>
</NavLink>

          {user?.isAdmin && (
            <NavLink to="/admin/users" className={linkClass}>
              Admin Users <span style={{ opacity: 0.6, fontWeight: 900 }}>★</span>
            </NavLink>
          )}
        </nav>

        <div className="shell__footer">
          <button className="btn btn--primary" onClick={logout} type="button">
            Logout
          </button>

          <div className="p" style={{ fontSize: 12 }}>
            Sessão: <strong>{user?.email ?? "—"}</strong>
          </div>
        </div>
      </aside>

      <main className="shell__main">
        <div className="shell__content">
          {/* Aqui entra cada página privada */}
          <Outlet />
        </div>
      </main>
    </div>
  );
}
