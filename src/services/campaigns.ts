
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
    id: number;
    title: string;
    description: string | null;
    category: string | null;
    start_at: string;
    end_at: string;
    appointment_required: boolean;
    health_unit_id: number | null;
    health_units: HealthUnit[];
};

import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

export async function getCampaignsByDate(date: Date): Promise<Campaign[]> {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const snapshot = await getDocs(query(collection(db, 'campaigns'),
        where('start_at', '>=', start.toISOString()),
        where('start_at', '<', end.toISOString()),
        orderBy('start_at', 'asc')));
    const campaigns = snapshot.docs.map(doc => doc.data() as Omit<Campaign, 'health_units'>);
    const units = new Map<number, HealthUnit>();
    const unitIds = [...new Set(campaigns.map(c => c.health_unit_id).filter((id): id is number => id !== null))];
    // Fetch by document ID, avoiding a Firestore collection-wide read.
    await Promise.all(unitIds.map(async id => {
        const { doc, getDoc } = await import('firebase/firestore');
        const unit = await getDoc(doc(db, 'health_units', String(id)));
        if (unit.exists()) units.set(id, unit.data() as HealthUnit);
    }));
    return campaigns.map(c => ({ ...c, health_units: c.health_unit_id !== null && units.has(c.health_unit_id) ? [units.get(c.health_unit_id)!] : [] }));
}
