import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { flatsApi, type Flat, type FlatPayload } from "../api/flats.api";
import { unwrapFlat } from "../utils/apiUnwrap";

function toDateInput(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function EditFlat() {
  const navigate = useNavigate();
  const { id } = useParams();
  const flatId = Number(id);

  const [initial, setInitial] = useState<Flat | null>(null);
  const [form, setForm] = useState<FlatPayload | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (!flatId || Number.isNaN(flatId)) throw new Error("ID inválido.");

        const res = await flatsApi.getById(flatId);
        const flat = unwrapFlat(res.data);

        if (!flat?.id) {
          console.error("Resposta inesperada no getById (edit):", res.data);
          throw new Error("Resposta inválida do servidor.");
        }

        const payload: FlatPayload = {
          city: flat.city ?? "",
          streetName: flat.streetName ?? "",
          streetNumber: String(flat.streetNumber ?? ""),
          areaSize: Number(flat.areaSize ?? 0),
          hasAC: Boolean(flat.hasAC),
          yearBuilt: Number(flat.yearBuilt ?? new Date().getFullYear()),
          rentPrice: Number(flat.rentPrice ?? 0),
          dateAvailable: toDateInput(flat.dateAvailable),
        };

        if (mounted) {
          setInitial(flat);
          setForm(payload);
        }
      } catch (err: any) {
        console.error("EDIT LOAD ERROR:", err);
        if (mounted) setError("Não foi possível carregar este flat.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [flatId]);

  const canSubmit = useMemo(() => {
    if (!form) return false;

    return (
      form.city.trim().length > 0 &&
      form.streetName.trim().length > 0 &&
      form.streetNumber.trim().length > 0 &&
      form.areaSize > 0 &&
      form.yearBuilt >= 1800 &&
      form.rentPrice > 0 &&
      !!form.dateAvailable &&
      !isSaving
    );
  }, [form, isSaving]);

  const set = <K extends keyof FlatPayload>(key: K, value: FlatPayload[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form) return;

    setError(null);
    setIsSaving(true);

    try {
      const res = await flatsApi.update(flatId, form);
      const updated = unwrapFlat(res.data);

      if (!updated?.id) {
        console.error("Resposta inesperada no update:", res.data);
        throw new Error("Resposta inválida do servidor.");
      }

      navigate(`/flats/${updated.id}`, { replace: true });
    } catch (err: any) {
      const status = err?.response?.status;
      const data = err?.response?.data;

      const message =
        typeof data === "string"
          ? data
          : data?.message || data?.error || data?.msg || err?.message || "Não foi possível guardar.";

      setError(status ? `Erro ${status}: ${message}` : message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="card card--medium">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <h1 className="h1">Editar flat</h1>
          <p className="p mt-1">Atualiza os dados e guarda as alterações.</p>
        </div>

        <Link className="btn btn--secondary" to={initial ? `/flats/${initial.id}` : "/"}>
          Cancelar
        </Link>
      </div>

      <hr className="sep" />

      {isLoading && <p className="p">A carregar…</p>}
      {error && <div className="alert alert--danger">{error}</div>}

      {!isLoading && !error && form && (
        <form className="form" onSubmit={onSubmit}>
          <div className="grid-2">
            <div className="field">
              <label className="label">Cidade</label>
              <input className="input" value={form.city} onChange={(e) => set("city", e.target.value)} required />
            </div>

            <div className="field">
              <label className="label">Disponível a partir de</label>
              <input className="input" type="date" value={form.dateAvailable} onChange={(e) => set("dateAvailable", e.target.value)} required />
            </div>
          </div>

          <div className="field">
            <label className="label">Rua</label>
            <input className="input" value={form.streetName} onChange={(e) => set("streetName", e.target.value)} required />
          </div>

          <div className="grid-2">
            <div className="field">
              <label className="label">Nº</label>
              <input className="input" value={form.streetNumber} onChange={(e) => set("streetNumber", e.target.value)} required />
            </div>

            <div className="field">
              <label className="label">Área (m²)</label>
              <input className="input" type="number" min={1} value={form.areaSize} onChange={(e) => set("areaSize", Number(e.target.value))} required />
            </div>
          </div>

          <div className="grid-2">
            <div className="field">
              <label className="label">Ano</label>
              <input className="input" type="number" min={1800} value={form.yearBuilt} onChange={(e) => set("yearBuilt", Number(e.target.value))} required />
            </div>

            <div className="field">
              <label className="label">Renda (€)</label>
              <input className="input" type="number" min={1} value={form.rentPrice} onChange={(e) => set("rentPrice", Number(e.target.value))} required />
            </div>
          </div>

          <div className="field">
            <label className="label">Ar condicionado</label>

            {/* se quiseres 0 inline, adicionamos classe depois */}
            <label className="p" style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input type="checkbox" checked={form.hasAC} onChange={(e) => set("hasAC", e.target.checked)} />
              Tem AC
            </label>
          </div>

          <button className="btn btn--primary" disabled={!canSubmit} type="submit">
            {isSaving ? "A guardar..." : "Guardar alterações"}
          </button>
        </form>
      )}
    </div>
  );
}
