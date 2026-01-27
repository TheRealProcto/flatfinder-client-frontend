import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { messagesApi, type Message } from "../api/messages.api";
import { flatsApi, type Flat } from "../api/flats.api";
import { unwrapFlat } from "../utils/apiUnwrap";
import { useAuth } from "../contexts/useAuth";

export default function MessagesThread() {
  const { user } = useAuth();
  const { flatId, otherUserId } = useParams();

  const flatIdNum = Number(flatId);
  const otherIdNum = Number(otherUserId);

  const canUse = useMemo(
    () => Number.isInteger(flatIdNum) && flatIdNum > 0 && Number.isInteger(otherIdNum) && otherIdNum > 0,
    [flatIdNum, otherIdNum]
  );

  const [flat, setFlat] = useState<Flat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);

  const myId = user?.id;
  const isOwner = !!(flat && myId && flat.ownerId === myId);

  const fmtDateTime = (iso?: string) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("pt-PT");
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (!canUse) throw new Error("IDs inválidos.");

        // flat + thread (em paralelo)
        const [flatRes, threadRes] = await Promise.all([
          flatsApi.getById(flatIdNum),
          messagesApi.getFlatThread(flatIdNum, otherIdNum),
        ]);

        const nextFlat = unwrapFlat(flatRes.data);
        if (!nextFlat?.id) throw new Error("Flat inválido.");

        if (mounted) {
          setFlat(nextFlat);
          setMessages(threadRes.data.data.messages || []);
        }
      } catch (err) {
        console.error("THREAD PAGE ERROR:", err);
        if (mounted) setError("Não foi possível carregar a conversa.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [canUse, flatIdNum, otherIdNum]);

  const onSend = async () => {
    if (!canUse || !flat) return;

    const text = msg.trim();
    if (text.length < 1) return;

    setSending(true);
    try {
      // Se sou owner, tenho de passar receiverId=otherUserId
      const receiverId = isOwner ? otherIdNum : undefined;

      const r = await messagesApi.send(flat.id, text, receiverId);
      const created = r.data.data.message;

      setMsg("");
      setMessages((prev) => [...prev, created]);
    } catch (err) {
      console.error("SEND THREAD ERROR:", err);
      alert("Não foi possível enviar a mensagem.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <h1 className="h1">Conversa</h1>
          <p className="p mt-1">
            {flat ? `${flat.city} — ${flat.streetName}, ${flat.streetNumber}` : "—"}
          </p>
        </div>

        <div className="actions">
          <Link className="btn btn--secondary" to="/messages">
            Inbox
          </Link>
          {flat && (
            <Link className="btn btn--secondary" to={`/flats/${flat.id}`}>
              Ver flat
            </Link>
          )}
        </div>
      </div>

      <hr className="sep" />

      {isLoading && <p className="p">A carregar…</p>}
      {error && <div className="alert alert--danger">{error}</div>}

      {!isLoading && !error && (
        <>
          <div style={{ display: "grid", gap: 8 }}>
            {messages.length === 0 ? (
              <p className="p">Sem mensagens ainda.</p>
            ) : (
              messages.map((m) => {
                const mine = myId === m.senderId;
                return (
                  <div
                    key={m.id}
                    className="card"
                    style={{ maxWidth: 760, marginLeft: mine ? "auto" : 0 }}
                  >
                    <div className="p" style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                      {m.content}
                    </div>
                    <div className="p mt-1" style={{ margin: 0, fontSize: 12, opacity: 0.65 }}>
                      {mine ? "Tu" : "Outro"} • {fmtDateTime(m.createdAt)}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <hr className="sep" />

          <textarea
            className="input"
            rows={3}
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            placeholder="Escreve a tua mensagem…"
          />

          <div className="mt-2" style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button className="btn btn--primary" type="button" onClick={onSend} disabled={sending}>
              {sending ? "A enviar…" : "Enviar"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
