import React from 'react';

import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

interface ServiceMapProps {
  onPress?: () => void;
}

export default function ServiceMap({
  onPress,
}: ServiceMapProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >

      <Ionicons
        name="location-outline"
        size={27}
        color="#07805F"
      />

      <Text style={styles.title}>
        Ver unidades e serviços
      </Text>

      <Text style={styles.subtitle}>
        Ver mapa completo
      </Text>

    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 107,

    backgroundColor: '#E1F1ED',

    borderRadius: 14,

    borderWidth: 1,
    borderColor: '#D5E8E2',

    justifyContent: 'center',
    alignItems: 'center',

    marginBottom: 17,
  },

  title: {
    fontSize: 12,
    fontWeight: '700',
    color: '#07805F',

    marginTop: 2,
  },

  subtitle: {
    fontSize: 9,
    color: '#07805F',

    marginTop: 3,
  },
});