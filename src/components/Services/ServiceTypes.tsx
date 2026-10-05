import React from 'react';

import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

import ServiceTypeCard from './ServiceTypeCard';

export default function ServiceTypes() {
  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        Por tipo de serviço
      </Text>

      <View style={styles.cards}>

        <ServiceTypeCard
          icon="add"
          title="Postos"
          color="#07805F"
        />

        <ServiceTypeCard
          icon="add"
          title="UPAs"
          color="#D9364B"
        />

        <ServiceTypeCard
          icon="medkit-outline"
          title="Farmácias"
          color="#1686B0"
        />

      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 18,
  },

  title: {
    fontSize: 13,
    fontWeight: '700',

    color: '#102F38',

    marginBottom: 8,
  },

  cards: {
    flexDirection: 'row',
    gap: 8,
  },
});