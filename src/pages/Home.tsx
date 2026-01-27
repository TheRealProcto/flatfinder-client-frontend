import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { flatsApi, type Flat, type FlatsMeta, type FlatsGetAllParams } from "../api/flats.api";
import { useAuth } from "../contexts/useAuth";

type SortOption =
  | "newest"
  | "oldest"
  | "price_asc"
  | "price_desc"
  | "area_asc"
  | "area_desc"
  | "available_asc"
  | "available_desc";

type FiltersState = {
  city: string;

  minPrice: string;
  maxPrice: string;

  minArea: string;

  hasAC: "" | "true" | "false";
  availableFrom: string; // YYYY-MM-DD

  sort: SortOption;
  onlyMine: boolean; // ✅ novo
};

const DEFAULT_FILTERS: FiltersState = {
  city: "",
  minPrice: "",
  maxPrice: "",
  minArea: "",
  hasAC: "",
  availableFrom: "",
  sort: "newest",
  onlyMine: false, // ✅ novo
};

function toNumberOrUndefined(v: string): number | undefined {
  const trimmed = v.trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : undefined;
}

function safeDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-PT");
}

function FlatCard({
  flat,
  onOpen,
  myId,
}: {
  flat: Flat;
  onOpen: () => void;
  myId: number | null;
}) {
  const isMine = !!(myId && flat.ownerId === myId);

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
          <span
            className="badge"
            style={{ display: "inline-block", marginBottom: 6 }}
            title={isMine ? "Este flat é teu" : "Flat de outro utilizador"}
          >
            {isMine ? "MEU" : "OUTRO"}
          </span>

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
        <Link className="btn btn--secondary" to={`/flats/${flat.id}`} onClick={(e) => e.stopPropagation()}>
          Ver detalhe
        </Link>

        {/* ✅ Editar só se for teu */}
        {isMine && (
          <Link className="btn btn--secondary" to={`/flats/${flat.id}/edit`} onClick={(e) => e.stopPropagation()}>
            Editar
          </Link>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();

  const { user } = useAuth();
  const myId = user?.id ?? null;

  const [flats, setFlats] = useState<Flat[]>([]);
  const [meta, setMeta] = useState<FlatsMeta | null>(null);

  const [page, setPage] = useState(1);
  const limit = 9;

  const [filters, setFilters] = useState<FiltersState>(DEFAULT_FILTERS);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Params EXACTOS que o teu backend aceita.
   */
  const apiParams: FlatsGetAllParams = useMemo(() => {
    const minPrice = toNumberOrUndefined(filters.minPrice);
    const maxPrice = toNumberOrUndefined(filters.maxPrice);
    const minArea = toNumberOrUndefined(filters.minArea);

    const hasAC = filters.hasAC === "true" ? true : filters.hasAC === "false" ? false : undefined;

    return {
      page,
      limit,
      sort: filters.sort,

      city: filters.city.trim() || undefined,

      minPrice,
      maxPrice,
      minArea,

      hasAC,
      availableFrom: filters.availableFrom.trim() || undefined,

      // ✅ só meus (usa ownerId no backend)
      ownerId: filters.onlyMine && myId ? myId : undefined,
    };
  }, [page, limit, filters, myId]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await flatsApi.getAll(apiParams);

        const list = res.data.data.flats;
        const nextMeta = res.data.data.meta;

        if (mounted) {
          setFlats(list);
          setMeta(nextMeta);
        }
      } catch (err: any) {
        console.error("HOME /flats ERROR:", err);
        if (mounted) setError("Não foi possível carregar os flats. Verifica a API e o token.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [apiParams]);

  const updateFilters = (patch: Partial<FiltersState>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  };

  const goPrev = () => {
    if (!meta?.hasPrevPage) return;
    setPage((p) => Math.max(1, p - 1));
  };

  const goNext = () => {
    if (!meta?.hasNextPage) return;
    setPage((p) => p + 1);
  };

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <h1 className="h1">Pesquisar flats</h1>
          <p className="p mt-1">Filtra por cidade, preço, área e disponibilidade.</p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="btn btn--secondary" onClick={clearFilters}>
            Limpar filtros
          </button>
        </div>
      </div>

      <hr className="sep" />

      {/* Filtros (alinhados com backend) */}
      <div
        className="mt-2"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(12, 1fr)",
          gap: 12,
          alignItems: "end",
        }}
      >
        <div style={{ gridColumn: "span 4" }}>
          <label className="label">Cidade</label>
          <input
            className="input"
            value={filters.city}
            onChange={(e) => updateFilters({ city: e.target.value })}
            placeholder="Ex: Évora"
          />
        </div>

        <div style={{ gridColumn: "span 2" }}>
          <label className="label">Preço min (€)</label>
          <input
            className="input"
            inputMode="numeric"
            value={filters.minPrice}
            onChange={(e) => updateFilters({ minPrice: e.target.value })}
            placeholder="0"
          />
        </div>

        <div style={{ gridColumn: "span 2" }}>
          <label className="label">Preço max (€)</label>
          <input
            className="input"
            inputMode="numeric"
            value={filters.maxPrice}
            onChange={(e) => updateFilters({ maxPrice: e.target.value })}
            placeholder="1500"
          />
        </div>

        <div style={{ gridColumn: "span 2" }}>
          <label className="label">Área min (m²)</label>
          <input
            className="input"
            inputMode="numeric"
            value={filters.minArea}
            onChange={(e) => updateFilters({ minArea: e.target.value })}
            placeholder="30"
          />
        </div>

        <div style={{ gridColumn: "span 2" }}>
          <label className="label">AC</label>
          <select
            className="input"
            value={filters.hasAC}
            onChange={(e) => updateFilters({ hasAC: e.target.value as FiltersState["hasAC"] })}
          >
            <option value="">Qualquer</option>
            <option value="true">Sim</option>
            <option value="false">Não</option>
          </select>
        </div>

        {/* ✅ Toggle Todos / Só meus */}
        <div style={{ gridColumn: "span 2" }}>
          <label className="label">Mostrar</label>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => updateFilters({ onlyMine: !filters.onlyMine })}
            disabled={!myId}
            title={!myId ? "Sessão sem user carregado" : ""}
            style={{ width: "100%" }}
          >
            {filters.onlyMine ? "Só meus" : "Todos"}
          </button>
        </div>

        <div style={{ gridColumn: "span 3" }}>
          <label className="label">Disponível a partir de</label>
          <input
            className="input"
            type="date"
            value={filters.availableFrom}
            onChange={(e) => updateFilters({ availableFrom: e.target.value })}
          />
        </div>

        <div style={{ gridColumn: "span 3" }}>
          <label className="label">Ordenar</label>
          <select
            className="input"
            value={filters.sort}
            onChange={(e) => updateFilters({ sort: e.target.value as SortOption })}
          >
            <option value="newest">Mais recentes</option>
            <option value="oldest">Mais antigos</option>
            <option value="price_asc">Preço (baixo → alto)</option>
            <option value="price_desc">Preço (alto → baixo)</option>
            <option value="area_asc">Área (baixa → alta)</option>
            <option value="area_desc">Área (alta → baixa)</option>
            <option value="available_asc">Disponibilidade (mais cedo)</option>
            <option value="available_desc">Disponibilidade (mais tarde)</option>
          </select>
        </div>
      </div>

      <hr className="sep" />

      {isLoading && <p className="p">A carregar flats…</p>}
      {error && <div className="alert alert--danger">{error}</div>}

      {!isLoading && !error && (
        <>
          {flats.length === 0 ? (
            <p className="p mt-2">Sem flats para mostrar com estes filtros.</p>
          ) : (
            <>
              <div
                className="mt-3"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: 12,
                }}
              >
                {flats.map((f) => (
                  <FlatCard key={f.id} flat={f} myId={myId} onOpen={() => navigate(`/flats/${f.id}`)} />
                ))}
              </div>

              <div className="pagination mt-3">
                <div className="pagination__info">
                  {meta ? `Página ${meta.page} de ${meta.totalPages} • Total: ${meta.total}` : `Página ${page}`}
                </div>

                <div className="pagination__actions">
                  <button type="button" className="btn btn--secondary" onClick={goPrev} disabled={!meta?.hasPrevPage}>
                    ← Anterior
                  </button>
                  <button type="button" className="btn btn--secondary" onClick={goNext} disabled={!meta?.hasNextPage}>
                    Seguinte →
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
