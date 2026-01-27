import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Flat } from "../api/flats.api";
import { favouritesApi } from "../api/favourites.api";

function safeDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-PT");
}

function FavouriteCard({
  flat,
  onOpen,
  onRemove,
  isRemoving,
}: {
  flat: Flat;
  onOpen: () => void;
  onRemove: () => void;
  isRemoving: boolean;
}) {
  return (
    <div className="card" style={{ cursor: "pointer" }} onClick={onOpen} title="Abrir detalhe">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 18 }}>{flat.city}</h3>
          <p className="p mt-1" style={{ margin: 0 }}>
            {flat.streetName} {flat.streetNumber}
          </p>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 800 }}>{flat.rentPrice} €</div>
          <div className="p" style={{ margin: 0, opacity: 0.75 }}>
            {flat.areaSize} m²
          </div>
        </div>
      </div>

      <hr className="sep" />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div className="p" style={{ margin: 0 }}>
          <strong>AC:</strong> {flat.hasAC ? "Sim" : "Não"}
        </div>
        <div className="p" style={{ margin: 0 }}>
          <strong>Ano:</strong> {flat.yearBuilt}
        </div>
        <div className="p" style={{ margin: 0 }}>
          <strong>Disponível:</strong> {safeDate(flat.dateAvailable)}
        </div>
      </div>

      <div className="mt-2" style={{ display: "flex", gap: 8 }}>
        <Link
          className="btn btn--secondary"
          to={`/flats/${flat.id}`}
          onClick={(e) => e.stopPropagation()}
        >
          Ver detalhe
        </Link>

        <button
          type="button"
          className="btn btn--secondary"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          disabled={isRemoving}
          title="Remover dos favoritos"
        >
          {isRemoving ? "A remover…" : "Remover"}
        </button>
      </div>
    </div>
  );
}

export default function Favourites() {
  const navigate = useNavigate();

  const [flats, setFlats] = useState<Flat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await favouritesApi.getMine();
      setFlats(res.data.data.flats);
    } catch (err) {
      console.error("FAVOURITES ERROR:", err);
      setError("Não foi possível carregar os favoritos.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (flatId: number) => {
    setRemovingId(flatId);
    setError(null);

    try {
      await favouritesApi.remove(flatId);
      setFlats((prev) => prev.filter((f) => f.id !== flatId));
    } catch (err) {
      console.error("REMOVE FAV ERROR:", err);
      setError("Não foi possível remover dos favoritos.");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <h1 className="h1">Favoritos</h1>
          <p className="p mt-1">Os flats que guardaste para veres mais tarde.</p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="btn btn--secondary" onClick={load} disabled={isLoading}>
            {isLoading ? "A atualizar…" : "Atualizar"}
          </button>

          <button type="button" className="btn btn--secondary" onClick={() => navigate("/")}>
            Voltar à Home
          </button>
        </div>
      </div>

      <hr className="sep" />

      {isLoading && <p className="p">A carregar favoritos…</p>}
      {error && <div className="alert alert--danger">{error}</div>}

      {!isLoading && !error && (
        <>
          {flats.length === 0 ? (
            <p className="p mt-2">Ainda não tens favoritos.</p>
          ) : (
            <div
              className="mt-3"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 12,
              }}
            >
              {flats.map((f) => (
                <FavouriteCard
                  key={f.id}
                  flat={f}
                  onOpen={() => navigate(`/flats/${f.id}`)}
                  onRemove={() => remove(f.id)}
                  isRemoving={removingId === f.id}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
