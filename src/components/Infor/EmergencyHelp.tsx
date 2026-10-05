import React from 'react';

import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

export default function EmergencyHelp() {
  return (
    <View style={styles.container}>

      <View style={styles.header}>

        <Ionicons
          name="alert-circle-outline"
          size={17}
          color="#07805F"
        />

        <Text style={styles.title}>
          Precisa de ajuda agora?
        </Text>

      </View>

      <Text style={styles.text}>
        SAMU 192 • Disque Saúde 136 • CVV 188
      </Text>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E1F3ED',

    borderWidth: 1,
    borderColor: '#A8DCCD',

    borderRadius: 13,

    padding: 12,

    marginTop: 3,
  },

  header: {
    flexDirection: 'row',

    alignItems: 'center',

    gap: 5,

    marginBottom: 5,
  },

  title: {
    fontSize: 11,

    fontWeight: '700',

    color: '#07805F',
  },

  text: {
    fontSize: 9,

    color: '#42645B',
  },
});