/**
 * apiUnwrap.ts
 * Normaliza respostas do backend para evitarmos bugs por formatos diferentes.
 * Suporta:
 * - { success: true, data: Flat }
 * - { success: true, data: { flat: Flat } }
 * - { success: true, data: { data: { flat: Flat } } } (fallback)
 */
export function unwrapFlat(payload: any) {
  return (
    payload?.data?.flat ??
    payload?.data?.data?.flat ??
    payload?.data ??
    payload?.flat ??
    null
  );
}

export function unwrapFlatsList(payload: any) {
  const flats =
    payload?.data?.flats ??
    payload?.data?.data?.flats ??
    payload?.flats ??
    [];

  const meta =
    payload?.data?.meta ??
    payload?.data?.data?.meta ??
    payload?.meta ??
    null;

  return { flats, meta };
}
