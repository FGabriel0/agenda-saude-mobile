import { supabase } from '../lib/supabase';

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

export async function getCampaignsByDate(
    date: Date
): Promise<Campaign[]> {

    // Início do dia selecionado
    const inicioDoDia = new Date(date);
    inicioDoDia.setHours(0, 0, 0, 0);

    // Início do dia seguinte
    const fimDoDia = new Date(date);
    fimDoDia.setDate(fimDoDia.getDate() + 1);
    fimDoDia.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
        .from('campaigns')
        .select(`
            id,
            title,
            description,
            category,
            start_at,
            end_at,
            appointment_required,
            health_unit_id,
            health_units (
                id,
                name,
                type,
                address,
                city,
                state,
                latitude,
                longitude,
                opening_hours
            )
        `)
        .gte(
            'start_at',
            inicioDoDia.toISOString()
        )
        .lt(
            'start_at',
            fimDoDia.toISOString()
        )
        .order(
            'start_at',
            { ascending: true }
        );

    if (error) {
        console.error(
            'Erro ao buscar campanhas:',
            error
        );

        throw error;
    }

    return data ?? [];
}