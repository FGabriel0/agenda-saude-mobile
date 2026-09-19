import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

import { COLORS } from '@/styles/theme';

interface AppointmentCardProps {
  horario: string;
  titulo: string;
  local: string;
  cor: string;
}

export default function AppointmentCard({
  horario,
  titulo,
  local,
  cor,
}: AppointmentCardProps) {
  return (
    <View style={styles.card}>

      <View
        style={[
          styles.timeContainer,
          { backgroundColor: cor },
        ]}
      >
        <Text style={styles.time}>
          {horario}
        </Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.title}>
          {titulo}
        </Text>

        <Text style={styles.location}>
          {local}
        </Text>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 58,
    backgroundColor: COLORS.white,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: COLORS.border,

    flexDirection: 'row',
    alignItems: 'center',

    padding: 8,
  },

  timeContainer: {
    width: 42,
    height: 42,
    borderRadius: 9,

    justifyContent: 'center',
    alignItems: 'center',
  },

  time: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
  },

  info: {
    flex: 1,
    marginLeft: 10,
  },

  title: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },

  location: {
    fontSize: 9,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});