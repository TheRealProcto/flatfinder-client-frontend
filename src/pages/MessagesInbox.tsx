import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { messagesApi, type InboxItem } from "../api/messages.api";
import { useAuth } from "../contexts/useAuth";

export default function MessagesInbox() {
  const { user } = useAuth();

  const [threads, setThreads] = useState<InboxItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fmtDateTime = (iso?: string) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("pt-PT");
  };

  const myId = user?.id;

  const normalised = useMemo(() => {
    if (!myId) return [];

    return (threads || []).map((t) => {
      const otherId = t.senderId === myId ? t.receiverId : t.senderId;
      const other =
        t.senderId === myId ? t.receiver : t.sender;

      const flatLabel = t.flat
        ? `${t.flat.city} — ${t.flat.streetName}, ${t.flat.streetNumber}`
        : `Flat #${t.flatId}`;

      return {
        ...t,
        otherId,
        otherName: other ? `${other.firstName} ${other.lastName}` : `User #${otherId}`,
        flatLabel,
        isOwner: t.flat?.ownerId === myId,
      };
    });
  }, [threads, myId]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setIsLoading(true);
      setError(null);

      try {
        const r = await messagesApi.getInbox();
        if (mounted) setThreads(r.data.data.threads || []);
      } catch (err) {
        console.error("INBOX ERROR:", err);
        if (mounted) setError("Não foi possível carregar as mensagens.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <h1 className="h1">Mensagens</h1>
          <p className="p mt-1">As tuas conversas por flat.</p>
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
          {normalised.length === 0 ? (
            <p className="p mt-2">Ainda não tens conversas.</p>
          ) : (
            <div className="mt-2" style={{ display: "grid", gap: 10 }}>
              {normalised.map((t) => (
                <Link
                  key={`${t.flatId}-${t.otherId}`}
                  className="card"
                  to={`/messages/${t.flatId}/${t.otherId}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 900 }}>{t.flatLabel}</div>
                      <div className="p" style={{ margin: 0, opacity: 0.75 }}>
                        Com: <strong>{t.otherName}</strong> {t.isOwner ? "(Interessado)" : "(Owner)"}
                      </div>
                    </div>

                    <div className="p" style={{ margin: 0, fontSize: 12, opacity: 0.7, whiteSpace: "nowrap" }}>
                      {fmtDateTime(t.createdAt)}
                    </div>
                  </div>

                  <div className="p mt-2" style={{ margin: 0 }}>
                    {t.content}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
