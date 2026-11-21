
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';

import { db } from '../lib/firebase';

export type HealthUnit = {
  id: number;
  name: string;
  type: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  opening_hours: string | null;
};

export type Campaign = {
  id: number | string;
  firestoreId: string;
  title: string;
  description: string | null;
  category: string | null;
  start_at: string;
  end_at: string;
  appointment_required: boolean;
  health_unit_id: number | null;
  health_units: HealthUnit[];
  status: string;
  isPublished: boolean;
  isBookable: boolean;
  sourceType: string | null;
  location: string | null;
  address: string | null;
};

export type OfficialCampaign = {
  id: string;
  title: string;
  description: string | null;
  source: string | null;
  sourceUrl: string | null;
  city: string | null;
  state: string | null;
  status: string;
  isPublished: boolean;
  isBookable: boolean;
};

function texto(valor: unknown): string | null {
  return typeof valor === 'string' ? valor : null;
}

function numero(valor: unknown): number | null {
  return typeof valor === 'number' &&
    Number.isFinite(valor)
    ? valor
    : null;
}

function dataFortaleza(valor: unknown): string | null {
  if (typeof valor === 'string') {
    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) {
      return null;
    }

    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Fortaleza',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(data);
  }

  // Compatibilidade com Timestamp do Firestore.
  if (
    valor !== null &&
    typeof valor === 'object' &&
    'toDate' in valor &&
    typeof valor.toDate === 'function'
  ) {
    return dataFortaleza(valor.toDate().toISOString());
  }

  return null;
}

function dataSelecionadaISO(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');

  return `${ano}-${mes}-${dia}`;
}

export async function getCampaignsByDate(
  date: Date
): Promise<Campaign[]> {
  const diaSelecionado = dataSelecionadaISO(date);

  // Busca todas as campanhas aprovadas.
  // A comparação de datas ocorre no aplicativo.
  const snapshot = await getDocs(
    query(
      collection(db, 'campaigns'),
      where('status', '==', 'approved')
    )
  );

  const campanhas = snapshot.docs
    .map(documento => {
      const dados = documento.data();

      const inicio = dados.start_at;
      const fim = dados.end_at;

      const inicioISO =
        typeof inicio === 'string'
          ? inicio
          : inicio?.toDate?.()?.toISOString?.() ?? '';

      const fimISO =
        typeof fim === 'string'
          ? fim
          : fim?.toDate?.()?.toISOString?.() ?? '';

      const campanha: Campaign = {
        id: numero(dados.id) ?? documento.id,
        firestoreId: documento.id,
        title: texto(dados.title) ?? '',
        description: texto(dados.description),
        category: texto(dados.category),
        start_at: inicioISO,
        end_at: fimISO,
        appointment_required:
          dados.appointment_required === true,
        health_unit_id: numero(dados.health_unit_id),
        health_units: [],
        status: texto(dados.status) ?? '',
        isPublished: dados.isPublished === true,
        isBookable: dados.isBookable === true,
        sourceType: texto(dados.sourceType),
        location: texto(dados.location),
        address: texto(dados.address),
      };

      return campanha;
    })
    .filter(campanha => {
      const diaCampanha = dataFortaleza(
        campanha.start_at
      );

      console.log('Verificando campanha:', {
        titulo: campanha.title,
        firestoreId: campanha.firestoreId,
        start_at: campanha.start_at,
        diaCampanha,
        diaSelecionado,
      });

      return diaCampanha === diaSelecionado;
    });

  const idsUnidades = [
    ...new Set(
      campanhas
        .map(campanha => campanha.health_unit_id)
        .filter((id): id is number => id !== null)
    ),
  ];

  const unidades = new Map<number, HealthUnit>();

  await Promise.all(
    idsUnidades.map(async id => {
      const resultado = await getDoc(
        doc(db, 'health_units', String(id))
      );

      if (resultado.exists()) {
        unidades.set(
          id,
          resultado.data() as HealthUnit
        );
      }
    })
  );

  return campanhas
    .map(campanha => ({
      ...campanha,
      health_units:
        campanha.health_unit_id !== null &&
        unidades.has(campanha.health_unit_id)
          ? [unidades.get(campanha.health_unit_id)!]
          : [],
    }))
    .sort((a, b) =>
      a.start_at.localeCompare(b.start_at)
    );
}

export async function getPublishedOfficialCampaigns():
  Promise<OfficialCampaign[]> {
  const snapshot = await getDocs(
    query(
      collection(db, 'campaigns'),
      where('status', '==', 'approved')
    )
  );

  return snapshot.docs
    .filter(
      documento =>
        documento.data().sourceType ===
        'official_news'
    )
    .map(documento => {
      const dados = documento.data();

      return {
        id: documento.id,
        title: texto(dados.title) ?? '',
        description: texto(dados.description),
        source: texto(dados.source),
        sourceUrl: texto(dados.sourceUrl),
        city: texto(dados.city),
        state: texto(dados.state),
        status: texto(dados.status) ?? '',
        isPublished: true,
        isBookable: true,
      };
    });
}
