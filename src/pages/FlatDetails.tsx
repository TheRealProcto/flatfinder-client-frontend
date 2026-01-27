import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { flatsApi, type Flat } from "../api/flats.api";
import { favouritesApi } from "../api/favourites.api";
import { unwrapFlat } from "../utils/apiUnwrap";
import { messagesApi, type Message } from "../api/messages.api";
import { useAuth } from "../contexts/useAuth";

export default function FlatDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const flatId = Number(id);


  const [flat, setFlat] = useState<Flat | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);

  // Favoritos
  const [isFavourite, setIsFavourite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [favError, setFavError] = useState<string | null>(null);

  // Auth
  const { user } = useAuth();

  // Mensagens
  const [thread, setThread] = useState<Message[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgLoading, setMsgLoading] = useState(false);
  const [msgError, setMsgError] = useState<string | null>(null);

  const canUseFlatId = useMemo(() => Number.isInteger(flatId) && flatId > 0, [flatId]);

  const fmtDate = (iso?: string) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("pt-PT");
  };

  const fmtDateTime = (iso?: string) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("pt-PT");
  };

  const myId = user?.id ?? null;
  const isOwner = !!(flat && myId && flat.ownerId === myId);

  /**
   * Carrega thread (MVP):
   * - no detalhe do flat, só carregamos a thread automática para quem NÃO é owner.
   * - o owner vai gerir threads por interessado na Inbox (página Mensagens) mais tarde.
   */
  const loadThread = async (flatToLoad: Flat) => {
    if (!user?.id) return;
    if (flatToLoad.ownerId === user?.id) return;

    setThreadLoading(true);
    try {
      const r = await messagesApi.getFlatThread(flatToLoad.id);
      setThread(r.data.data.messages || []);
    } catch (err) {
      console.error("THREAD LOAD ERROR:", err);
      setThread([]);
    } finally {
      setThreadLoading(false);
    }
  };

  const onSendMessage = async () => {
    if (!flat?.id) return;

    const text = msg.trim();
    if (text.length < 1) {
      setMsgError("Escreve uma mensagem antes de enviar.");
      return;
    }

    setMsgLoading(true);
    setMsgError(null);

    try {
      const r = await messagesApi.send(flat.id, text);
      const created = r.data.data.message;

      setMsg("");
      setThread((prev) => [...prev, created]);
    } catch (err) {
      console.error("SEND MESSAGE ERROR:", err);
      setMsgError("Não foi possível enviar a mensagem.");
    } finally {
      setMsgLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      setIsLoading(true);
      setError(null);
      setFavError(null);
      setMsgError(null);

      try {
        if (!canUseFlatId) throw new Error("ID inválido.");

        // Carregar detalhe + favoritos em paralelo
        const [flatRes, favRes] = await Promise.all([flatsApi.getById(flatId), favouritesApi.getMine()]);

        const response = flatRes.data;
        const next = unwrapFlat(response);

        if (!next?.id) {
          console.error("Resposta inesperada no getById:", response);
          throw new Error("Resposta inválida do servidor.");
        }

        // Verifica se este flat está nos favoritos
        const favIds = new Set((favRes.data.data.flats || []).map((f) => f.id));
        const nextIsFav = favIds.has(next.id);

        if (mounted) {
          setFlat(next);
          setIsFavourite(nextIsFav);

          // reset da UI de mensagens ao mudar de flat
          setThread([]);
          setMsg("");
        }

        // Carregar mensagens (não bloqueia o detalhe)
        await loadThread(next);
      } catch (err: any) {
        console.error("FLAT DETAILS ERROR:", err);
        if (mounted) setError("Não foi possível carregar este flat.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [flatId, canUseFlatId, user?.id]);

  const toggleFavourite = async () => {
    if (!flat?.id) return;

    setFavLoading(true);
    setFavError(null);

    try {
      if (!isFavourite) {
        await favouritesApi.add(flat.id);
        setIsFavourite(true);
      } else {
        await favouritesApi.remove(flat.id);
        setIsFavourite(false);
      }
    } catch (err: any) {
      const status = err?.response?.status;

      // Se ao adicionar vier 409, tratamos como já favorito
      if (!isFavourite && status === 409) {
        setIsFavourite(true);
        return;
      }

      console.error("TOGGLE FAV ERROR:", err);
      setFavError("Não foi possível atualizar os favoritos.");
    } finally {
      setFavLoading(false);
    }
  };

  const onDelete = async () => {
    if (!flat) return;

    const ok = confirm("Tens a certeza que queres apagar este flat?");
    if (!ok) return;

    setIsDeleting(true);
    setError(null);

    try {
      await flatsApi.remove(flat.id);
      navigate("/", { replace: true });
    } catch (err: any) {
      console.error("DELETE ERROR:", err);
      setError("Não foi possível apagar. Verifica permissões (owner) e token.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="card">
      {/* Header do card + ações */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <h1 className="h1">Detalhe do flat</h1>
          <p className="p mt-1">Consulta os dados e gere o anúncio.</p>
        </div>

        <div className="actions">
          <Link className="btn btn--secondary" to="/">
            Voltar
          </Link>

          <button
            type="button"
            className="btn btn--secondary"
            onClick={toggleFavourite}
            disabled={!flat || favLoading}
            title={isFavourite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          >
            {favLoading ? "A atualizar…" : isFavourite ? "♥ Remover" : "♡ Guardar"}
          </button>

          {flat && isOwner && (
  <>
    <Link className="btn btn--secondary" to={`/flats/${flat.id}/edit`}>
      Editar
    </Link>

    <button className="btn btn--primary" onClick={onDelete} disabled={isDeleting}>
      {isDeleting ? "A apagar..." : "Apagar"}
    </button>
  </>
)}
        </div>
      </div>

      <hr className="sep" />

      {isLoading && <p className="p">A carregar…</p>}
      {error && <div className="alert alert--danger">{error}</div>}
      {favError && <div className="alert alert--danger">{favError}</div>}

      {!isLoading && !error && flat && (
        <>
          <h2 className="h2">
            {flat.city} — {flat.streetName}, {flat.streetNumber}
          </h2>

          <p className="p mt-1">Disponível: {fmtDate(flat.dateAvailable)}</p>

          <hr className="sep" />

          <div className="table-wrap">
            <table className="table">
              <tbody>
                <tr>
                  <th>Área (m²)</th>
                  <td>{flat.areaSize}</td>
                </tr>
                <tr>
                  <th>Ar condicionado</th>
                  <td>{flat.hasAC ? "Sim" : "Não"}</td>
                </tr>
                <tr>
                  <th>Ano</th>
                  <td>{flat.yearBuilt}</td>
                </tr>
                <tr>
                  <th>Renda (€)</th>
                  <td>{flat.rentPrice}</td>
                </tr>
                <tr>
                  <th>Owner ID</th>
                  <td>{flat.ownerId ?? "—"}</td>
                </tr>
                <tr>
                  <th>Criado em</th>
                  <td>{fmtDateTime(flat.createdAt)}</td>
                </tr>
                <tr>
                  <th>Atualizado em</th>
                  <td>{fmtDateTime(flat.updatedAt)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <hr className="sep" />

          {/* Mensagens */}
          <section>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <div>
                <h2 className="h2" style={{ marginBottom: 6 }}>
                  Mensagens
                </h2>
                <p className="p" style={{ margin: 0 }}>
                  {isOwner
                    ? "Como owner, vais gerir as conversas na página Mensagens (Inbox)."
                    : "Envia mensagem ao owner para combinar visita ou esclarecer dúvidas."}
                </p>
              </div>
            </div>

            {!isOwner && (
              <>
                {msgError && <div className="alert alert--danger mt-2">{msgError}</div>}

                <textarea
                  className="input mt-2"
                  rows={4}
                  value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                  placeholder="Olá! Tenho interesse no flat. Podemos combinar uma visita?"
                />

                <div className="mt-2" style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={() => setMsg("")}
                    disabled={msgLoading || msg.length === 0}
                  >
                    Limpar
                  </button>

                  <button type="button" className="btn btn--primary" onClick={onSendMessage} disabled={msgLoading}>
                    {msgLoading ? "A enviar…" : "Enviar"}
                  </button>
                </div>
              </>
            )}

            <div className="mt-3">
              {threadLoading ? (
                <p className="p">A carregar conversa…</p>
              ) : thread.length === 0 ? (
                <p className="p">{isOwner ? "—" : "Ainda não há mensagens neste anúncio."}</p>
              ) : (
                <div style={{ display: "grid", gap: 8 }}>
                  {thread.slice(-5).map((m) => {
                    const mine = user?.id === m.senderId;
                    return (
                      <div key={m.id} className="card" style={{ maxWidth: 760, marginLeft: mine ? "auto" : 0 }}>
                        <div className="p" style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                          {m.content}
                        </div>
                        <div className="p mt-1" style={{ margin: 0, fontSize: 12, opacity: 0.65 }}>
                          {mine ? "Tu" : "Owner"} • {fmtDateTime(m.createdAt)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
