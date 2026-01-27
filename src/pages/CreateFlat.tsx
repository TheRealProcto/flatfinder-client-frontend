import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { flatsApi, type FlatPayload } from "../api/flats.api";
import { unwrapFlat } from "../utils/apiUnwrap";

export default function CreateFlat() {
  const navigate = useNavigate();

  const [form, setForm] = useState<FlatPayload>({
    city: "",
    streetName: "",
    streetNumber: "",
    areaSize: 0,
    hasAC: false,
    yearBuilt: new Date().getFullYear(),
    rentPrice: 0,
    dateAvailable: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
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
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      const res = await flatsApi.create(form);

      const response = res.data;
      const flat = unwrapFlat(response);

      if (!flat?.id) {
        console.error("Resposta inesperada no create:", response);
        throw new Error("O servidor não devolveu o ID do flat.");
      }

      navigate(`/flats/${flat.id}`, { replace: true });
    } catch (err: any) {
      const status = err?.response?.status;
      const data = err?.response?.data;

      const message =
        typeof data === "string"
          ? data
          : data?.message ||
            data?.error ||
            data?.msg ||
            err?.message ||
            "Não foi possível criar o flat.";

      setError(status ? `Erro ${status}: ${message}` : message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="card card--medium">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <h1 className="h1">Criar flat</h1>
          <p className="p mt-1">Adiciona um novo anúncio com os dados essenciais.</p>
        </div>

        <Link className="btn btn--secondary" to="/">
          Voltar
        </Link>
      </div>

      <hr className="sep" />

      <form className="form" onSubmit={onSubmit}>
        <div className="grid-2">
          <div className="field">
            <label className="label">Cidade</label>
            <input
              className="input"
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label className="label">Disponível a partir de</label>
            <input
              className="input"
              type="date"
              value={form.dateAvailable}
              onChange={(e) => set("dateAvailable", e.target.value)}
              required
            />
          </div>
        </div>

        <div className="field">
          <label className="label">Rua</label>
          <input
            className="input"
            value={form.streetName}
            onChange={(e) => set("streetName", e.target.value)}
            required
          />
        </div>

        <div className="grid-2">
          <div className="field">
            <label className="label">Nº</label>
            <input
              className="input"
              value={form.streetNumber}
              onChange={(e) => set("streetNumber", e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label className="label">Área (m²)</label>
            <input
              className="input"
              type="number"
              min={1}
              value={form.areaSize}
              onChange={(e) => set("areaSize", Number(e.target.value))}
              required
            />
          </div>
        </div>

        <div className="grid-2">
          <div className="field">
            <label className="label">Ano</label>
            <input
              className="input"
              type="number"
              min={1800}
              value={form.yearBuilt}
              onChange={(e) => set("yearBuilt", Number(e.target.value))}
              required
            />
          </div>

          <div className="field">
            <label className="label">Renda (€)</label>
            <input
              className="input"
              type="number"
              min={1}
              value={form.rentPrice}
              onChange={(e) => set("rentPrice", Number(e.target.value))}
              required
            />
          </div>
        </div>

        <div className="field">
          <label className="label">Ar condicionado</label>

          {/* Se quiseres 100% sem inline, eu crio a classe no CSS */}
          <label className="p" style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={form.hasAC}
              onChange={(e) => set("hasAC", e.target.checked)}
            />
            Tem AC
          </label>
        </div>

        {error && <div className="alert alert--danger">{error}</div>}

        <button className="btn btn--primary" disabled={!canSubmit} type="submit">
          {isSaving ? "A guardar..." : "Criar flat"}
        </button>
      </form>
    </div>
  );
}
