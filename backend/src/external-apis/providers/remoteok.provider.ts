import type { Job, JobSearchParams } from '../../types/job.types.js';
import { fetchJson } from '../../utils/http-client.js';
import { matchesKeywords } from '../keyword-filter.js';

const API_URL = 'https://remoteok.com/api';
// RemoteOK devuelve 403 sin un User-Agent que parezca de navegador.
const USER_AGENT = 'Mozilla/5.0 (compatible; HireFireBot/1.0; +https://github.com/NicoGarcia12/HireFire)';

interface RawRemoteOkItem {
  id?: string;
  position?: string;
  company?: string;
  location?: string;
  description?: string;
  tags?: string[];
  url?: string;
  apply_url?: string;
  date?: string;
}

/** El primer item del array es un aviso legal, no una oferta. */
function isJobItem(item: RawRemoteOkItem): item is Required<Pick<RawRemoteOkItem, 'id' | 'position' | 'company'>> &
  RawRemoteOkItem {
  return Boolean(item.id && item.position && item.company);
}

function normalize(raw: RawRemoteOkItem): Job {
  return {
    id: `remoteok-${raw.id}`,
    title: raw.position ?? 'Sin título',
    company: raw.company ?? 'Empresa desconocida',
    location: raw.location || 'Remoto',
    remote: true,
    description: raw.description ?? '',
    url: raw.url ?? raw.apply_url ?? '',
    postedAt: raw.date,
    provider: 'remoteok',
  };
}

/** RemoteOK no soporta búsqueda por keyword en la API, así que filtramos del lado del cliente. */
export async function searchRemoteOk(params: JobSearchParams): Promise<Job[]> {
  const limit = params.limit ?? 50;
  const items = await fetchJson<RawRemoteOkItem[]>(API_URL, {
    headers: { 'User-Agent': USER_AGENT },
  });

  return items
    .filter(isJobItem)
    .filter((raw) => matchesKeywords(`${raw.position} ${(raw.tags ?? []).join(' ')}`, params.keywords))
    .slice(0, limit)
    .map(normalize);
}
