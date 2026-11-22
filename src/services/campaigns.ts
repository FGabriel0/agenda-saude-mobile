import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

export type HealthUnit = {
  id: number; name: string; type: string | null; address: string | null;
  city: string | null; state: string | null; latitude: number | null;
  longitude: number | null; opening_hours: string | null;
};

export type Campaign = {
  id: number | string; firestoreId: string; title: string;
  description: string | null; category: string | null;
  start_at: string; end_at: string; appointment_required: boolean;
  health_unit_id: number | null; health_units: HealthUnit[];
  status: string; isPublished: boolean; isBookable: boolean;
  timeConfirmed: boolean; sourceType: string | null;
  location: string | null; address: string | null;
  suggestedStartTime: string | null; suggestedEndTime: string | null;
  aiStartTime: string | null; aiEndTime: string | null;
};

export type OfficialCampaign = {
  id: string; title: string; description: string | null;
  source: string | null; sourceUrl: string | null;
  city: string | null; state: string | null; status: string;
  isPublished: boolean; isBookable: boolean;
  timeConfirmed?: boolean;
};

function texto(v: unknown): string | null {
  return typeof v === 'string' ? v : null;
}
function numero(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}
function iso(v: unknown): string {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object' && 'toDate' in v &&
      typeof v.toDate === 'function') {
    const date = v.toDate();
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date.toISOString() : '';
  }
  return '';
}
function diaFortaleza(v: string): string | null {
  if (!v) return null;
  // Uma data sem horário representa um dia civil, não um instante UTC.
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const date = new Date(v);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Fortaleza', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}
function diaSelecionado(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export async function getCampaignsByDate(date: Date): Promise<Campaign[]> {
  const selected = diaSelecionado(date);
  const snapshot = await getDocs(query(collection(db, 'campaigns'), where('status', '==', 'approved')));
  const campanhas: Campaign[] = snapshot.docs.map(documento => {
    const d = documento.data();
    return {
      id: numero(d.id) ?? documento.id,
      firestoreId: documento.id,
      title: texto(d.title) ?? '', description: texto(d.description),
      category: texto(d.category), start_at: iso(d.start_at), end_at: iso(d.end_at),
      appointment_required: d.appointment_required === true,
      health_unit_id: numero(d.health_unit_id), health_units: [],
      status: texto(d.status) ?? '', isPublished: d.isPublished === true,
      isBookable: d.isBookable === true,
      // Apenas confirmação explícita é confirmação. A tela pode mostrar sugestões separadamente.
      timeConfirmed: d.timeConfirmed === true,
      sourceType: texto(d.sourceType), location: texto(d.location), address: texto(d.address),
      suggestedStartTime: texto(d.suggestedStartTime),
      suggestedEndTime: texto(d.suggestedEndTime),
      aiStartTime: texto(d.aiStartTime), aiEndTime: texto(d.aiEndTime),
    };
  }).filter(c => {
    const start = diaFortaleza(c.start_at), end = diaFortaleza(c.end_at);
    return c.isPublished && start !== null && end !== null && start <= selected && selected <= end;
  });
  const ids = [...new Set(campanhas.map(c => c.health_unit_id).filter((id): id is number => id !== null))];
  const units = new Map<number, HealthUnit>();
  await Promise.all(ids.map(async id => {
    const result = await getDoc(doc(db, 'health_units', String(id)));
    if (result.exists()) units.set(id, result.data() as HealthUnit);
  }));
  return campanhas.map(c => ({
    ...c,
    health_units: c.health_unit_id !== null && units.has(c.health_unit_id)
      ? [units.get(c.health_unit_id)!] : [],
  })).sort((a, b) => a.start_at.localeCompare(b.start_at));
}

export async function getPublishedOfficialCampaigns(): Promise<OfficialCampaign[]> {
  const snapshot = await getDocs(query(collection(db, 'campaigns'), where('status', '==', 'approved')));
  return snapshot.docs.filter(documento =>
    ['official_news', 'community_news'].includes(documento.data().sourceType) &&
    documento.data().isPublished === true
  ).map(documento => {
    const d = documento.data();
    return {
      id: documento.id, title: texto(d.title) ?? '',
      description: texto(d.description), source: texto(d.source),
      sourceUrl: texto(d.sourceUrl), city: texto(d.city), state: texto(d.state),
      status: texto(d.status) ?? '', isPublished: d.isPublished === true,
      isBookable: d.isBookable === true, timeConfirmed: d.timeConfirmed === true,
    };
  });
}
