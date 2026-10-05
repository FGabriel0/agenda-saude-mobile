import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '@/styles/theme';

import AppointmentCard from '../components/agenda/AppointmentCard';
import Calendar from '../components/agenda/Calendar';
import FilterButton from '../components/agenda/FilterButton';
import BottomNavigation from '../components/Home/BottomNavigation';
import Header from '../components/Home/Header';

import {
    cancelAppointment,
    createAppointment,
    getMyAppointments,
} from '../services/appointments';

import * as CampaignService from '../services/campaigns';

type Filtro = 'Todos' | 'Vacinação' | 'Doação';

type TipoModal =
    | 'sucesso'
    | 'erro'
    | 'aviso';

type Compromisso = {
    id: number;
    horario: string;
    titulo: string;
    local: string;
    tipo: 'Doação' | 'Vacinação';
    cor: string;
};

type Agendamento = {
    id: number;
    campaign_id: number;
};

export default function AgendaScreen() {
    const [
        filtroSelecionado,
        setFiltroSelecionado,
    ] = useState<Filtro>('Todos');

    const [
        dataSelecionada,
        setDataSelecionada,
    ] = useState<Date>(
        new Date(2026, 8, 14)
    );

    const [
        compromissos,
        setCompromissos,
    ] = useState<Compromisso[]>([]);

    const [
        agendamentos,
        setAgendamentos,
    ] = useState<Agendamento[]>([]);

    const [
        carregando,
        setCarregando,
    ] = useState(true);

    const [
        processandoId,
        setProcessandoId,
    ] = useState<number | null>(null);

    const [
        modalVisivel,
        setModalVisivel,
    ] = useState(false);

    const [
        mensagemModal,
        setMensagemModal,
    ] = useState('');

    const [
        tituloModal,
        setTituloModal,
    ] = useState('');

    const [
        tipoModal,
        setTipoModal,
    ] = useState<TipoModal>('sucesso');

    useEffect(() => {
        carregarCampanhas(
            dataSelecionada
        );

        carregarAgendamentos();
    }, [dataSelecionada]);

    function mostrarAviso(
        tipo: TipoModal,
        titulo: string,
        mensagem: string
    ) {
        setTipoModal(tipo);
        setTituloModal(titulo);
        setMensagemModal(mensagem);
        setModalVisivel(true);
    }

    async function carregarAgendamentos() {
        try {
            const dados =
                await getMyAppointments();

            setAgendamentos(
                dados.map((item) => ({
                    id: item.id,
                    campaign_id:
                        item.campaign_id,
                }))
            );
        } catch (error) {
            console.error(
                'Erro ao carregar agendamentos:',
                error
            );

            setAgendamentos([]);
        }
    }

    async function agendarCampanha(
        campaignId: number
    ) {
        const jaExiste =
            agendamentos.some(
                (item) =>
                    item.campaign_id ===
                    campaignId
            );

        if (jaExiste) {
            mostrarAviso(
                'aviso',
                'Agendamento já realizado',
                'Esta campanha já está na sua agenda.'
            );

            return;
        }

        try {
            setProcessandoId(
                campaignId
            );

            await createAppointment(
                campaignId
            );

            await carregarAgendamentos();

            mostrarAviso(
                'sucesso',
                'Agendamento confirmado!',
                'Seu agendamento foi realizado com sucesso. Você poderá acompanhá-lo pela sua agenda.'
            );
        } catch (error) {
            console.error(
                'Erro ao realizar agendamento:',
                error
            );

            const mensagem =
                error instanceof Error
                    ? error.message
                    : '';

            if (
                mensagem
                    .toLowerCase()
                    .includes('logado')
            ) {
                mostrarAviso(
                    'aviso',
                    'Login necessário',
                    'Você precisa estar logado para realizar um agendamento.'
                );
            } else {
                mostrarAviso(
                    'erro',
                    'Não foi possível agendar',
                    'Ocorreu um problema ao realizar o agendamento. Tente novamente.'
                );
            }
        } finally {
            setProcessandoId(null);
        }
    }

    async function cancelarCampanha(
        campaignId: number
    ) {
        const agendamento =
            agendamentos.find(
                (item) =>
                    item.campaign_id ===
                    campaignId
            );

        if (!agendamento) {
            mostrarAviso(
                'aviso',
                'Agendamento não encontrado',
                'Não encontramos este agendamento na sua agenda.'
            );

            return;
        }

        try {
            setProcessandoId(
                campaignId
            );

            await cancelAppointment(
                agendamento.id
            );

            await carregarAgendamentos();

            mostrarAviso(
                'sucesso',
                'Agendamento cancelado',
                'Seu agendamento foi cancelado com sucesso.'
            );
        } catch (error) {
            console.error(
                'Erro ao cancelar agendamento:',
                error
            );

            const mensagem =
                error instanceof Error
                    ? error.message
                    : '';

            if (
                mensagem
                    .toLowerCase()
                    .includes('logado')
            ) {
                mostrarAviso(
                    'aviso',
                    'Login necessário',
                    'Você precisa estar logado para cancelar um agendamento.'
                );
            } else {
                mostrarAviso(
                    'erro',
                    'Não foi possível cancelar',
                    'Ocorreu um problema ao cancelar o agendamento. Tente novamente.'
                );
            }
        } finally {
            setProcessandoId(null);
        }
    }

    async function carregarCampanhas(
        data: Date
    ) {
        try {
            setCarregando(true);

            const campanhas =
                await CampaignService
                    .getCampaignsByDate(
                        data
                    );

            const campanhasFormatadas:
                Compromisso[] =
                campanhas.map(
                    (campanha) => {
                        const dataCampanha =
                            new Date(
                                campanha.start_at
                            );

                        const horario =
                            dataCampanha
                                .toLocaleTimeString(
                                    'pt-BR',
                                    {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    }
                                );

                        const categoria =
                            campanha.category
                                ?.toLowerCase();

                        const tipo:
                            | 'Doação'
                            | 'Vacinação' =
                            categoria ===
                                'doacao' ||
                            categoria ===
                                'doação'
                                ? 'Doação'
                                : 'Vacinação';

                        const relacionamento =
                            campanha.health_units;

                        const unidade =
                            Array.isArray(
                                relacionamento
                            )
                                ? relacionamento[0]
                                : relacionamento;

                        return {
                            id: campanha.id,
                            horario,
                            titulo:
                                campanha.title,
                            local:
                                unidade?.name ??
                                'Local não informado',
                            tipo,
                            cor:
                                tipo ===
                                'Doação'
                                    ? COLORS.danger
                                    : COLORS.primary,
                        };
                    }
                );

            setCompromissos(
                campanhasFormatadas
            );
        } catch (error) {
            console.error(
                'Erro ao carregar campanhas:',
                error
            );

            setCompromissos([]);

            mostrarAviso(
                'erro',
                'Erro ao carregar',
                'Não foi possível carregar as campanhas. Tente novamente.'
            );
        } finally {
            setCarregando(false);
        }
    }

    const compromissosFiltrados =
        filtroSelecionado === 'Todos'
            ? compromissos
            : compromissos.filter(
                  (item) =>
                      item.tipo ===
                      filtroSelecionado
              );

    const dataFormatada =
        dataSelecionada.toLocaleDateString(
            'pt-BR',
            {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
            }
        );

    const modalErro =
        tipoModal === 'erro';

    const modalAviso =
        tipoModal === 'aviso';

    const simboloModal =
        modalErro
            ? '!'
            : modalAviso
              ? 'i'
              : '✓';

    return (
        <SafeAreaView
            style={styles.container}
        >
            <View style={styles.content}>
                <ScrollView
                    showsVerticalScrollIndicator={
                        false
                    }
                    contentContainerStyle={
                        styles.scrollContent
                    }
                >
                    <Header
                        title="Agenda"
                        observation="Acompanhe as ações de saúde próximas a você"
                    />

                    <Calendar
                        onDateChange={
                            setDataSelecionada
                        }
                    />

                    <View
                        style={styles.filters}
                    >
                        <FilterButton
                            title="Todos"
                            active={
                                filtroSelecionado ===
                                'Todos'
                            }
                            onPress={() =>
                                setFiltroSelecionado(
                                    'Todos'
                                )
                            }
                        />

                        <FilterButton
                            title="Vacinação"
                            active={
                                filtroSelecionado ===
                                'Vacinação'
                            }
                            onPress={() =>
                                setFiltroSelecionado(
                                    'Vacinação'
                                )
                            }
                        />

                        <FilterButton
                            title="Doação"
                            active={
                                filtroSelecionado ===
                                'Doação'
                            }
                            onPress={() =>
                                setFiltroSelecionado(
                                    'Doação'
                                )
                            }
                        />
                    </View>

                    <Text
                        style={
                            styles.dayTitle
                        }
                    >
                        {dataFormatada}
                    </Text>

                    {carregando && (
                        <ActivityIndicator
                            size="large"
                            color={
                                COLORS.primary
                            }
                        />
                    )}

                    {!carregando && (
                        <View
                            style={
                                styles.appointments
                            }
                        >
                            {compromissosFiltrados.map(
                                (item) => {
                                    const agendado =
                                        agendamentos.some(
                                            (
                                                agendamento
                                            ) =>
                                                agendamento.campaign_id ===
                                                item.id
                                        );

                                    const processando =
                                        processandoId ===
                                        item.id;

                                    return (
                                        <View
                                            key={
                                                item.id
                                            }
                                        >
                                            <AppointmentCard
                                                horario={
                                                    item.horario
                                                }
                                                titulo={
                                                    item.titulo
                                                }
                                                local={
                                                    item.local
                                                }
                                                cor={
                                                    item.cor
                                                }
                                                agendado={
                                                    agendado
                                                }
                                                onAgendar={
                                                    processando
                                                        ? undefined
                                                        : () =>
                                                              agendarCampanha(
                                                                  item.id
                                                              )
                                                }
                                                onCancelar={
                                                    processando
                                                        ? undefined
                                                        : () =>
                                                              cancelarCampanha(
                                                                  item.id
                                                              )
                                                }
                                            />

                                            {processando && (
                                                <ActivityIndicator
                                                    size="small"
                                                    color={
                                                        COLORS.primary
                                                    }
                                                    style={
                                                        styles.processing
                                                    }
                                                />
                                            )}
                                        </View>
                                    );
                                }
                            )}

                            {compromissosFiltrados.length ===
                                0 && (
                                <Text
                                    style={
                                        styles.emptyText
                                    }
                                >
                                    Nenhuma campanha
                                    encontrada para
                                    esta data.
                                </Text>
                            )}
                        </View>
                    )}
                </ScrollView>

                <BottomNavigation />
            </View>

            <Modal
                visible={modalVisivel}
                transparent
                animationType="fade"
                onRequestClose={() =>
                    setModalVisivel(false)
                }
            >
                <View
                    style={
                        styles.modalOverlay
                    }
                >
                    <View
                        style={
                            styles.modalCard
                        }
                    >
                        <View
                            style={[
                                styles.modalIcon,
                                modalErro
                                    ? styles.errorIcon
                                    : modalAviso
                                      ? styles.warningIcon
                                      : styles.successIcon,
                            ]}
                        >
                            <Text
                                style={
                                    styles.modalIconText
                                }
                            >
                                {
                                    simboloModal
                                }
                            </Text>
                        </View>

                        <Text
                            style={
                                styles.modalTitle
                            }
                        >
                            {tituloModal}
                        </Text>

                        <Text
                            style={
                                styles.modalDescription
                            }
                        >
                            {mensagemModal}
                        </Text>

                        <TouchableOpacity
                            style={[
                                styles.modalButton,
                                modalErro
                                    ? styles.errorButton
                                    : modalAviso
                                      ? styles.warningButton
                                      : styles.successButton,
                            ]}
                            onPress={() =>
                                setModalVisivel(
                                    false
                                )
                            }
                        >
                            <Text
                                style={
                                    styles.modalButtonText
                                }
                            >
                                Entendi
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor:
            COLORS.background,
    },

    content: {
        flex: 1,
        paddingHorizontal: 16,
    },

    scrollContent: {
        paddingTop: 15,
        paddingBottom: 100,
    },

    filters: {
        flexDirection: 'row',
        marginTop: 10,
        marginBottom: 14,
        gap: 8,
    },

    dayTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 10,
        textTransform: 'capitalize',
    },

    appointments: {
        gap: 10,
    },

    emptyText: {
        textAlign: 'center',
        marginTop: 20,
        color: COLORS.text,
    },

    processing: {
        marginTop: 6,
    },

    modalOverlay: {
        flex: 1,
        backgroundColor:
            'rgba(0, 0, 0, 0.35)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },

    modalCard: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: COLORS.white,
        borderRadius: 18,
        padding: 24,
        alignItems: 'center',
    },

    modalIcon: {
        width: 54,
        height: 54,
        borderRadius: 27,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },

    successIcon: {
        backgroundColor:
            COLORS.primary,
    },

    warningIcon: {
        backgroundColor: '#E59B18',
    },

    errorIcon: {
        backgroundColor:
            COLORS.danger,
    },

    modalIconText: {
        color: COLORS.white,
        fontSize: 28,
        fontWeight: '800',
    },

    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        textAlign: 'center',
    },

    modalDescription: {
        fontSize: 13,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 19,
        marginTop: 8,
        marginBottom: 20,
    },

    modalButton: {
        width: '100%',
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
    },

    successButton: {
        backgroundColor:
            COLORS.primary,
    },

    warningButton: {
        backgroundColor: '#E59B18',
    },

    errorButton: {
        backgroundColor:
            COLORS.danger,
    },

    modalButtonText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '700',
    },
});