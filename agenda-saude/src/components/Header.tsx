import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { COLORS } from '@/styles/theme';
export default function Header() {
  return (
    <View style={styles.container}>

      <View style={styles.logoIcon}>
        <Text style={styles.plus}>+</Text>
      </View>

      <View>
        <Text style={styles.title}>
          Agenda Saúde
        </Text>

        <Text style={styles.subtitle}>
          Cuidado perto de você
        </Text>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 70,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 15,
  },

  logoIcon: {
    width: 48,
    height: 48,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  plus: {
    color: COLORS.white,
    fontSize: 40,
    fontWeight: '300',
    lineHeight: 43,
  },

  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
  },

  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
});