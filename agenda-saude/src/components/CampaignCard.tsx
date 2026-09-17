import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import { COLORS } from '../styles/theme';

export default function CampaignCard() {
  return (
    <View style={styles.container}>

      <Text style={styles.tag}>
        VACINAÇÃO
      </Text>

      <Text style={styles.title}>
        Campanha contra a gripe
      </Text>

      <Text style={styles.description}>
        Proteção para toda a comunidade. Atendimento
        gratuito nas unidades participantes.
      </Text>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>
          Ver campanha
        </Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primary,
    borderRadius: 15,
    padding: 18,
    height: 220,
    marginBottom: 25,
  },

  tag: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 15,
  },

  title: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 5,
  },

  description: {
    color: '#E6F7F2',
    fontSize: 13,
    lineHeight: 18,
  },

  button: {
    backgroundColor: COLORS.white,
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginTop: 12,
  },

  buttonText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '800',
  },
});