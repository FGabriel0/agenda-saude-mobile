import { supabase } from '../lib/supabase';

export type Appointment = {
    id: number;
    created_at: string;
    user_id: string;
    campaign_id: number;
};

/**
 * Cria um agendamento para o usuário autenticado.
 */
export async function createAppointment(
    campaignId: number
): Promise<Appointment> {
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
        throw userError;
    }

    if (!user) {
        throw new Error(
            'Você precisa estar logado para realizar um agendamento.'
        );
    }

    const { data, error } = await supabase
        .from('appointments')
        .insert({
            user_id: user.id,
            campaign_id: campaignId,
        })
        .select()
        .single();

    if (error) {
        console.error(
            'Erro ao criar agendamento:',
            error
        );

        throw error;
    }

    return data;
}

/**
 * Busca somente os agendamentos do usuário autenticado.
 */
export async function getMyAppointments(): Promise<
    Appointment[]
> {
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
        throw userError;
    }

    if (!user) {
        throw new Error(
            'Você precisa estar logado para visualizar seus agendamentos.'
        );
    }

    const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', {
            ascending: false,
        });

    if (error) {
        console.error(
            'Erro ao buscar agendamentos:',
            error
        );

        throw error;
    }

    return data ?? [];
}

/**
 * Cancela um agendamento do usuário autenticado.
 */
export async function cancelAppointment(
    appointmentId: number
): Promise<void> {
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
        throw userError;
    }

    if (!user) {
        throw new Error(
            'Você precisa estar logado para cancelar um agendamento.'
        );
    }

    const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId)
        .eq('user_id', user.id);

    if (error) {
        console.error(
            'Erro ao cancelar agendamento:',
            error
        );

        throw error;
    }
}