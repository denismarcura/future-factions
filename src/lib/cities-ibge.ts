// IBGE city autocomplete. Loads the full municipalities list once and caches it.
export type IbgeCity = { id: number; nome: string; uf: string };

let cache: IbgeCity[] | null = null;
let loading: Promise<IbgeCity[]> | null = null;

export async function loadCities(): Promise<IbgeCity[]> {
  if (cache) return cache;
  if (loading) return loading;
  loading = fetch("https://servicodados.ibge.gov.br/api/v1/localidades/municipios")
    .then((r) => r.json())
    .then((data: Array<{ id: number; nome: string; microrregiao: { mesorregiao: { UF: { sigla: string } } } }>) => {
      const list: IbgeCity[] = data.map((c) => ({
        id: c.id,
        nome: c.nome,
        uf: c.microrregiao?.mesorregiao?.UF?.sigla ?? "",
      }));
      cache = list;
      return list;
    })
    .catch(() => {
      loading = null;
      return [];
    });
  return loading;
}

export function searchCities(list: IbgeCity[], query: string, limit = 8): IbgeCity[] {
  const q = query.trim().toLowerCase();
  if (q.length < 3) return [];
  const out: IbgeCity[] = [];
  for (const c of list) {
    if (c.nome.toLowerCase().startsWith(q) || c.nome.toLowerCase().includes(q)) {
      out.push(c);
      if (out.length >= limit) break;
    }
  }
  return out;
}
