

import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import type { CampanhaHome } from '../../screens/HomeScreen';
import { COLORS } from '../../styles/theme';

type Props = {
  titulo?: string;
  campanhas: CampanhaHome[];
  textoVazio?: string;
  mostrarConfirmacao?: boolean;
  onVerTodas?: () => void;
  onSelecionar?: (campanha: CampanhaHome) => void;
};

function formatarData(valor: string) {
  const data = new Date(valor);

  return {
    dia: data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      timeZone: 'America/Fortaleza',
    }),
    mes: data
      .toLocaleDateString('pt-BR', {
        month: 'short',
        timeZone: 'America/Fortaleza',
      })
      .replace('.', '')
      .toUpperCase(),
  };
}

function formatarHorario(valor: string) {
  if (!valor) return '';

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return '';
  }

  return data.toLocaleTimeString('pt-BR', {
    timeZone: 'America/Fortaleza',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function NextCampaign({
  titulo = 'Próximas campanhas',
  campanhas,
  textoVazio = 'Nenhuma campanha encontrada.',
  mostrarConfirmacao = false,
  onVerTodas,
  onSelecionar,
}: Props) {
  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.title}>
          {titulo}
        </Text>

        <TouchableOpacity onPress={onVerTodas}>
          <Text style={styles.seeAll}>
            {mostrarConfirmacao
              ? 'Ver agenda'
              : 'Ver todas'}
          </Text>
        </TouchableOpacity>
      </View>

      {campanhas.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            {textoVazio}
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {campanhas.map(campanha => {
            const data = formatarData(campanha.inicio);

            const horarioInicio =
              formatarHorario(campanha.inicio);

            const horarioFim =
              formatarHorario(campanha.fim);

            const horario = horarioFim
              ? `${horarioInicio} às ${horarioFim}`
              : horarioInicio;

            const local =
              campanha.unidade ||
              campanha.endereco ||
              'Local não informado';

            return (
              <TouchableOpacity
                key={campanha.id}
                style={styles.card}
                activeOpacity={0.8}
                onPress={() =>
                  onSelecionar?.(campanha)
                }
              >
                <View style={styles.date}>
                  <Text style={styles.number}>
                    {data.dia}
                  </Text>

                  <Text style={styles.month}>
                    {data.mes}
                  </Text>
                </View>

                <View style={styles.info}>
                  <Text style={styles.campaignTitle}>
                    {campanha.titulo}
                  </Text>

                  <Text style={styles.description}>
                    {horario} • {local}
                  </Text>

                  {mostrarConfirmacao && (
                    <View style={styles.status}>
                      <Ionicons
                        name="checkmark-circle"
                        size={14}
                        color={COLORS.primary}
                      />

                      <Text style={styles.statusText}>
                        Agendamento confirmado
                      </Text>
                    </View>
                  )}
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  title: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
    flex: 1,
  },

  seeAll: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 10,
  },

  list: {
    gap: 10,
  },

  card: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 15,
    minHeight: 100,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  date: {
    width: 65,
    height: 65,
    borderRadius: 15,
    backgroundColor: COLORS.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    flexShrink: 0,
  },

  number: {
    color: COLORS.danger,
    fontSize: 24,
    fontWeight: '900',
  },

  month: {
    color: COLORS.danger,
    fontSize: 11,
    fontWeight: '800',
  },

  info: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },

  campaignTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 5,
    flexWrap: 'wrap',
  },

  description: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    flexWrap: 'wrap',
  },

  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 7,
  },

  statusText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '700',
  },

  emptyCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
  },

  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
});
