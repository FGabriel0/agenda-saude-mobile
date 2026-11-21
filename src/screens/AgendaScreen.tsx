
import { useFocusEffect } from 'expo-router';

import {
    useCallback,
    useState,
} from 'react';

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

import AppointmentCard from '../components/agenda/AppointmentCard';
import Calendar from '../components/agenda/Calendar';
import FilterButton from '../components/agenda/FilterButton';

import BottomNavigation from '../components/Home/BottomNavigation';
import Header from '../components/Home/Header';

import { COLORS } from '../styles/theme';

import {
    cancelAppointment,
    createAppointment,
    getMyAppointments,
} from '../services/appointments';

import { getCampaignsByDate } from '../services/campaigns';

type Filtro = 'Todos' | 'Vacinação' | 'Doação';
type TipoModal = 'sucesso' | 'erro' | 'aviso';

type TipoUnidade =
  | 'Público'
  | 'Privado'
  | 'Não informado';

type Compromisso = {
  id: string | number;
  campaignId: string | number;
  agendavel: boolean;
  horario: string;
  horarioFim?: string;
  titulo: string;
  endereco: string;
  tipoUnidade: TipoUnidade;
  tipo: 'Doação' | 'Vacinação' | 'Outros';
  cor: string;
};

type Agendamento = {
  id: string;
  campaign_id: string | number;
};

function formatarHorario(
  valor: string | null | undefined
): string | undefined {
  if (!valor) return undefined;

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return undefined;
  }

  return data.toLocaleTimeString('pt-BR', {
    timeZone: 'America/Fortaleza',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function identificarTipoUnidade(
  valor: string | null | undefined
): TipoUnidade {
  if (!valor) return 'Não informado';

  const normalizado = valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (
    normalizado.includes('privad') ||
    normalizado.includes('particular')
  ) {
    return 'Privado';
  }

  if (
    normalizado.includes('public') ||
    normalizado.includes('municipal') ||
    normalizado.includes('estadual') ||
    normalizado.includes('federal')
  ) {
    return 'Público';
  }

  return 'Não informado';
}

export default function AgendaScreen() {
  const [dataSelecionada, setDataSelecionada] =
    useState<Date>(() => new Date());

  const [filtroSelecionado, setFiltroSelecionado] =
    useState<Filtro>('Todos');

  const [compromissos, setCompromissos] =
    useState<Compromisso[]>([]);

  const [agendamentos, setAgendamentos] =
    useState<Agendamento[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  const [processandoId, setProcessandoId] =
    useState<string | number | null>(null);

  const [modalVisivel, setModalVisivel] =
    useState(false);

  const [tituloModal, setTituloModal] =
    useState('');

  const [mensagemModal, setMensagemModal] =
    useState('');

  function mostrarAviso(
    tipo: TipoModal,
    titulo: string,
    mensagem: string
  ) {
    setTituloModal(titulo);
    setMensagemModal(mensagem);
    setModalVisivel(true);
  }

  const carregarAgendamentos = useCallback(
    async () => {
      try {
        const dados = await getMyAppointments();

        setAgendamentos(
          dados.map(item => ({
            id: String(item.id),
            campaign_id: item.campaign_id,
          }))
        );
      } catch (error) {
        console.error(
          'Erro ao carregar agendamentos:',
          error
        );

        setAgendamentos([]);
      }
    },
    []
  );

  const carregarCampanhas = useCallback(
    async (data: Date) => {
      try {
        setCarregando(true);

        const campanhas =
          await getCampaignsByDate(data);

        const formatadas: Compromisso[] =
          campanhas.map(campanha => {
            const horario =
              formatarHorario(campanha.start_at) ??
              'Não informado';

            const horarioFim =
              formatarHorario(campanha.end_at);

            const categoria =
              campanha.category?.toLowerCase() ?? '';

            const tipo:
              | 'Vacinação'
              | 'Doação'
              | 'Outros' =
              categoria.includes('vacin')
                ? 'Vacinação'
                : categoria.includes('doa')
                  ? 'Doação'
                  : 'Outros';

            const tipoUnidade =
              identificarTipoUnidade(
                campanha.health_units?.[0]?.type
              );

            const endereco =
              campanha.address?.trim() ||
              campanha.health_units?.[0]?.address?.trim() ||
              'Endereço não informado';

            const agendavel =
              campanha.status === 'approved';

            return {
              id: campanha.firestoreId,
              campaignId: campanha.firestoreId,
              agendavel,
              horario,
              horarioFim,
              titulo: campanha.title,
              endereco,
              tipoUnidade,
              tipo,
              cor:
                tipo === 'Doação'
                  ? COLORS.danger
                  : COLORS.primary,
            };
          });

        setCompromissos(formatadas);
      } catch (error) {
        console.error(
          'Erro ao carregar campanhas:',
          error
        );

        setCompromissos([]);

        mostrarAviso(
          'erro',
          'Erro ao carregar campanhas',
          'Não foi possível consultar as campanhas.'
        );
      } finally {
        setCarregando(false);
      }
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      carregarCampanhas(dataSelecionada);
      carregarAgendamentos();
    }, [
      dataSelecionada,
      carregarCampanhas,
      carregarAgendamentos,
    ])
  );

  async function agendarCampanha(
    campaignId: string | number
  ) {
    const existente = agendamentos.some(
      item =>
        String(item.campaign_id) ===
        String(campaignId)
    );

    if (existente) {
      mostrarAviso(
        'aviso',
        'Agendamento já realizado',
        'Você já agendou esta campanha.'
      );
      return;
    }

    try {
      setProcessandoId(campaignId);

      await createAppointment(campaignId);
      await carregarAgendamentos();

      mostrarAviso(
        'sucesso',
        'Agendamento confirmado!',
        'Seu agendamento foi realizado com sucesso.'
      );
    } catch (error) {
      mostrarAviso(
        'erro',
        'Não foi possível agendar',
        error instanceof Error
          ? error.message
          : 'Erro desconhecido.'
      );
    } finally {
      setProcessandoId(null);
    }
  }

  async function cancelarCampanha(
    campaignId: string | number
  ) {
    const agendamento = agendamentos.find(
      item =>
        String(item.campaign_id) ===
        String(campaignId)
    );

    if (!agendamento) {
      mostrarAviso(
        'aviso',
        'Agendamento não encontrado',
        'Não encontramos este agendamento.'
      );
      return;
    }

    try {
      setProcessandoId(campaignId);

      await cancelAppointment(agendamento.id);
      await carregarAgendamentos();

      mostrarAviso(
        'sucesso',
        'Agendamento cancelado',
        'Seu agendamento foi cancelado com sucesso.'
      );
    } catch (error) {
      mostrarAviso(
        'erro',
        'Não foi possível cancelar',
        error instanceof Error
          ? error.message
          : 'Erro desconhecido.'
      );
    } finally {
      setProcessandoId(null);
    }
  }

  const compromissosFiltrados =
    filtroSelecionado === 'Todos'
      ? compromissos
      : compromissos.filter(
          item => item.tipo === filtroSelecionado
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            styles.scrollContent
          }
        >
          <Header
            title="Agenda"
            observation="Acompanhe as ações de saúde próximas a você"
          />

          <Calendar
            selectedDate={dataSelecionada}
            onDateChange={setDataSelecionada}
          />

          <View style={styles.filters}>
            <FilterButton
              title="Todos"
              active={
                filtroSelecionado === 'Todos'
              }
              onPress={() =>
                setFiltroSelecionado('Todos')
              }
            />

            <FilterButton
              title="Vacinação"
              active={
                filtroSelecionado === 'Vacinação'
              }
              onPress={() =>
                setFiltroSelecionado('Vacinação')
              }
            />

            <FilterButton
              title="Doação"
              active={
                filtroSelecionado === 'Doação'
              }
              onPress={() =>
                setFiltroSelecionado('Doação')
              }
            />
          </View>

          <Text style={styles.dayTitle}>
            {dataFormatada}
          </Text>

          {carregando ? (
            <ActivityIndicator
              size="large"
              color={COLORS.primary}
            />
          ) : (
            <View style={styles.appointments}>
              {compromissosFiltrados.map(item => {
                const campaignId = item.campaignId;

                const agendado = agendamentos.some(
                  a =>
                    String(a.campaign_id) ===
                    String(campaignId)
                );

                const processando =
                  processandoId === campaignId;

                return (
                  <View key={String(item.id)}>
                    <AppointmentCard
                      horario={item.horario}
                      horarioFim={item.horarioFim}
                      titulo={item.titulo}
                      endereco={item.endereco}
                      tipoUnidade={item.tipoUnidade}
                      cor={item.cor}
                      agendado={agendado}
                      onAgendar={
                        item.agendavel &&
                        !agendado &&
                        !processando
                          ? () =>
                              agendarCampanha(campaignId)
                          : undefined
                      }
                      onCancelar={
                        agendado && !processando
                          ? () =>
                              cancelarCampanha(campaignId)
                          : undefined
                      }
                    />

                    {processando && (
                      <ActivityIndicator
                        size="small"
                        color={COLORS.primary}
                        style={styles.processing}
                      />
                    )}
                  </View>
                );
              })}

              {compromissosFiltrados.length === 0 && (
                <Text style={styles.emptyText}>
                  Nenhuma campanha encontrada
                  para esta data.
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {tituloModal}
            </Text>

            <Text style={styles.modalDescription}>
              {mensagemModal}
            </Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() =>
                setModalVisivel(false)
              }
            >
              <Text style={styles.modalButtonText}>
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
    backgroundColor: COLORS.background,
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
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
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
    marginTop: 12,
    marginBottom: 20,
  },

  modalButton: {
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },

  modalButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
});
