import React from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

export default function SearchFilters() {
  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        Filtrar resultados
      </Text>

      <Text style={styles.label}>
        Localização
      </Text>

      <View style={styles.location}>

        <Ionicons
          name="location-outline"
          size={14}
          color="#07805F"
        />

        <Text style={styles.locationText}>
          Fortaleza • Até 5 km
        </Text>

      </View>

      <Text style={styles.labelPeriod}>
        Período
      </Text>

      <View style={styles.periods}>

        <TouchableOpacity style={styles.period}>
          <Text style={styles.periodText}>
            Hoje
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.period,
            styles.activePeriod,
          ]}
        >
          <Text style={styles.activePeriodText}>
            Esta semana
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.period}>
          <Text style={styles.periodText}>
            Este mês
          </Text>
        </TouchableOpacity>

      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',

    borderWidth: 1,
    borderColor: '#DCE8E4',

    borderRadius: 13,

    padding: 13,

    marginBottom: 16,
  },

  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#102F38',

    marginBottom: 10,
  },

  label: {
    fontSize: 9,
    fontWeight: '600',
    color: '#52656A',

    marginBottom: 5,
  },

  location: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 5,
  },

  locationText: {
    fontSize: 10,
    color: '#17343B',
  },

  labelPeriod: {
    fontSize: 9,
    fontWeight: '600',
    color: '#52656A',

    marginTop: 12,
    marginBottom: 6,
  },

  periods: {
    flexDirection: 'row',
    gap: 6,
  },

  period: {
    height: 29,

    paddingHorizontal: 11,

    borderRadius: 15,

    borderWidth: 1,
    borderColor: '#DCE8E4',

    justifyContent: 'center',
    alignItems: 'center',
  },

  activePeriod: {
    backgroundColor: '#E1F3ED',
    borderColor: '#07805F',
  },

  periodText: {
    fontSize: 9,
    color: '#17343B',
  },

  activePeriodText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#07805F',
  },
});