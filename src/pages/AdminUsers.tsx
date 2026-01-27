import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { usersApi, type AdminUser } from "../api/users.api";

/**
 * Admin - Users
 * - Lista utilizadores
 * - Permite:
 *   - promover/rebaixar admin (toggle isAdmin)
 *   - apagar utilizador (com confirmação)
 */
export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const total = useMemo(() => users.length, [users]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await usersApi.list();

        // Suporta wrappers diferentes
        const list =
          (res.data as any)?.data?.users ??
          (res.data as any)?.data?.data?.users ??
          [];

        if (mounted) setUsers(list);
      } catch (err: any) {
        console.error("ADMIN USERS ERROR:", err);
        if (mounted) setError("Não foi possível carregar utilizadores.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const toggleAdmin = async (u: AdminUser) => {
    setBusyId(u.id);
    setError(null);

    try {
      const res = await usersApi.update(u.id, { isAdmin: !u.isAdmin });

      const updated =
        (res.data as any)?.data?.user ??
        (res.data as any)?.data ??
        null;

      if (!updated?.id) {
        console.error("Resposta inesperada update user:", res.data);
        throw new Error("Resposta inválida do servidor.");
      }

      setUsers((prev) =>
        prev.map((x) => (x.id === u.id ? { ...x, isAdmin: updated.isAdmin } : x))
      );
    } catch (err: any) {
      console.error("TOGGLE ADMIN ERROR:", err);
      setError("Não foi possível atualizar permissões.");
    } finally {
      setBusyId(null);
    }
  };

  const removeUser = async (u: AdminUser) => {
    const ok = confirm(`Apagar utilizador ${u.email}?`);
    if (!ok) return;

    setBusyId(u.id);
    setError(null);

    try {
      await usersApi.remove(u.id);
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
    } catch (err: any) {
      console.error("REMOVE USER ERROR:", err);
      setError("Não foi possível apagar o utilizador.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <h1 className="h1">Admin — Utilizadores</h1>
          <p className="p mt-1">Gerir permissões e contas. Total: {total}</p>
        </div>

        <Link className="btn btn--secondary" to="/">
          Voltar
        </Link>
      </div>

      <hr className="sep" />

      {isLoading && <p className="p">A carregar…</p>}
      {error && <div className="alert alert--danger">{error}</div>}

      {!isLoading && !error && (
        <>
          {users.length === 0 ? (
            <p className="p">Sem utilizadores para mostrar.</p>
          ) : (
            <div className="table-wrap mt-3">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Admin</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td>
                        {u.firstName} {u.lastName}
                      </td>
                      <td>{u.email}</td>
                      <td>{u.isAdmin ? "✅" : "—"}</td>
                      <td>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button
                            className="btn btn--secondary"
                            type="button"
                            disabled={busyId === u.id}
                            onClick={() => toggleAdmin(u)}
                          >
                            {u.isAdmin ? "Remover admin" : "Tornar admin"}
                          </button>

                          <button
                            className="btn btn--primary"
                            type="button"
                            disabled={busyId === u.id}
                            onClick={() => removeUser(u)}
                          >
                            Apagar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
