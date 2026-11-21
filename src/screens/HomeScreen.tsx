
import { router, useFocusEffect } from 'expo-router';
import { signOut } from 'firebase/auth';
import { useCallback, useState } from 'react';

import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';

import BottomNavigation from '../components/Home/BottomNavigation';
import CampaignCard from '../components/Home/CampaignCard';
import Header from '../components/Home/Header';
import NextCampaign from '../components/Home/NextCampaign';
import QuickAccess from '../components/Home/QuickAccess';

import { auth, db } from '../lib/firebase';
import { getMyAppointments } from '../services/appointments';
import { COLORS } from '../styles/theme';

export type CampanhaHome = {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  inicio: string;
  fim: string;
  endereco: string;
  unidade: string;
};

function converterData(valor: unknown): Date | null {
  if (typeof valor === 'string') {
    const data = new Date(valor);

    return Number.isNaN(data.getTime())
      ? null
      : data;
  }

  if (
    valor &&
    typeof valor === 'object' &&
    'toDate' in valor &&
    typeof valor.toDate === 'function'
  ) {
    const data = valor.toDate();

    return data instanceof Date &&
      !Number.isNaN(data.getTime())
      ? data
      : null;
  }

  return null;
}

function texto(valor: unknown): string {
  return typeof valor === 'string'
    ? valor.trim()
    : '';
}

export default function HomeScreen() {
  const [saindo, setSaindo] = useState(false);
  const [carregando, setCarregando] = useState(true);

  const [campanhas, setCampanhas] =
    useState<CampanhaHome[]>([]);

  const [agendadas, setAgendadas] =
    useState<CampanhaHome[]>([]);

  const carregarDados = useCallback(async () => {
    try {
      setCarregando(true);

      const [
        resultadoCampanhas,
        resultadoAgendamentos,
      ] = await Promise.all([
        getDocs(
          query(
            collection(db, 'campaigns'),
            where('status', '==', 'approved')
          )
        ),
        getMyAppointments(),
      ]);

      const todas: CampanhaHome[] =
        resultadoCampanhas.docs
          .map(documento => {
            const dados = documento.data();

            const inicio = converterData(
              dados.start_at
            );

            const fim = converterData(
              dados.end_at
            );

            return {
              id: documento.id,
              titulo: texto(dados.title),
              descricao: texto(dados.description),
              categoria: texto(dados.category),
              inicio: inicio?.toISOString() ?? '',
              fim: fim?.toISOString() ?? '',
              endereco: texto(dados.address),
              unidade: texto(dados.location),
            };
          })
          .filter(campanha => campanha.inicio !== '')
          .sort(
            (a, b) =>
              new Date(a.inicio).getTime() -
              new Date(b.inicio).getTime()
          );

      const agora = new Date();

      // Campanhas futuras aprovadas.
      const futuras = todas.filter(campanha => {
        const termino = campanha.fim
          ? new Date(campanha.fim)
          : new Date(campanha.inicio);

        return termino >= agora;
      });

      // Todos os agendamentos do usuário,
      // inclusive campanhas de datas anteriores.
      const idsAgendados = new Set(
        resultadoAgendamentos.map(item =>
          String(item.campaign_id)
        )
      );

      const campanhasAgendadas = todas.filter(
        campanha => idsAgendados.has(campanha.id)
      );

      setCampanhas(futuras);
      setAgendadas(campanhasAgendadas);
    } catch (error) {
      console.error(
        'Erro ao carregar dados da Home:',
        error
      );

      setCampanhas([]);
      setAgendadas([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [carregarDados])
  );

  async function sairDaConta() {
    try {
      setSaindo(true);

      await signOut(auth);

      router.replace('/login');
    } catch (error) {
      console.error(
        'Erro inesperado ao sair:',
        error
      );
    } finally {
      setSaindo(false);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.headerContainer}>
          <View style={styles.headerContent}>
            <Header
              title="Agenda Saúde"
              observation="Cuidado perto de você"
            />
          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={sairDaConta}
            disabled={saindo}
          >
            {saindo ? (
              <ActivityIndicator
                size="small"
                color={COLORS.danger}
              />
            ) : (
              <Text style={styles.logoutText}>
                Sair
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <CampaignCard
          campanhas={campanhas.slice(0, 3)}
          onVerCampanha={() =>
            router.push('/agenda')
          }
        />

        <QuickAccess />

        {carregando ? (
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
            style={styles.loading}
          />
        ) : (
          <>
            <NextCampaign
              titulo="Próximas campanhas"
              campanhas={campanhas.slice(0, 3)}
              textoVazio="Nenhuma campanha futura disponível."
              onVerTodas={() =>
                router.push('/agenda')
              }
              onSelecionar={() =>
                router.push('/agenda')
              }
            />

            <View style={styles.sectionSpacing}>
              <NextCampaign
                titulo="Campanhas agendadas"
                campanhas={agendadas}
                textoVazio="Você ainda não possui campanhas agendadas."
                onVerTodas={() =>
                  router.push('/agenda')
                }
                onSelecionar={() =>
                  router.push('/agenda')
                }
                mostrarConfirmacao
              />
            </View>
          </>
        )}
      </ScrollView>

      <BottomNavigation />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 110,
  },

  headerContainer: {
    width: '100%',
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  headerContent: {
    flex: 1,
  },

  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.danger,
    minWidth: 55,
    alignItems: 'center',
    marginRight: 12,
  },

  logoutText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: '600',
  },

  loading: {
    marginVertical: 30,
  },

  sectionSpacing: {
    marginTop: 24,
  },
});
