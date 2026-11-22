
import { Ionicons } from '@expo/vector-icons';

import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { COLORS } from '../../styles/theme';

interface AppointmentCardProps {
  horario: string;
  horarioFim?: string;
  titulo: string;
  endereco: string;
  cor: string;
  tipoUnidade?: 'Público' | 'Privado' | 'Não informado';
  agendado?: boolean;
  onAgendar?: () => void;
  onCancelar?: () => void;
}

export default function AppointmentCard({
  horario,
  horarioFim,
  titulo,
  endereco,
  cor,
  tipoUnidade = 'Não informado',
  agendado = false,
  onAgendar,
  onCancelar,
}: AppointmentCardProps) {
  const mostrarBotao = agendado
    ? typeof onCancelar === 'function'
    : typeof onAgendar === 'function';

  const periodo = horarioFim
    ? `${horario} às ${horarioFim}`
    : horario;

  return (
    <View style={styles.card}>
      <View
        style={[
          styles.timeContainer,
          { backgroundColor: cor },
        ]}
      >
        <Text
          style={styles.time}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {horario}
        </Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.title}>
          {titulo}
        </Text>

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Ionicons
              name="location-outline"
              size={13}
              color={COLORS.textSecondary}
            />
            <Text style={styles.detailText}>
              Endereço: {endereco || 'Não informado'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons
              name="time-outline"
              size={13}
              color={COLORS.textSecondary}
            />
            <Text style={styles.detailText}>
              Horário: {periodo}
            </Text>
          </View>

          {tipoUnidade !== 'Não informado' && (
            <View style={styles.detailRow}>
              <Ionicons
                name="business-outline"
                size={13}
                color={COLORS.textSecondary}
              />
              <Text style={styles.detailText}>
                Unidade: {tipoUnidade}
              </Text>
            </View>
          )}
        </View>
      </View>

      {mostrarBotao && (
        <TouchableOpacity
          style={styles.button}
          onPress={agendado ? onCancelar : onAgendar}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {agendado ? 'Cancelar' : 'Agendar'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    minHeight: 76,
    backgroundColor: COLORS.white,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    overflow: 'hidden',
  },

  timeContainer: {
    width: 42,
    height: 42,
    flexShrink: 0,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },

  time: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },

  info: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    marginLeft: 10,
  },

  title: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 17,
    flexShrink: 1,
    flexWrap: 'wrap',
  },

  details: {
    marginTop: 8,
    gap: 5,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
  },

  detailText: {
    flex: 1,
    minWidth: 0,
    fontSize: 10,
    lineHeight: 15,
    color: COLORS.textSecondary,
    flexShrink: 1,
  },

  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginLeft: 8,
    flexShrink: 0,
    alignSelf: 'center',
  },

  buttonText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
});
