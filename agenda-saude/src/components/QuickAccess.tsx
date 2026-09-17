import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import QuickAccessButton from './QuickAccessButton';
import { COLORS } from '../styles/theme';

export default function QuickAccess() {
  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        Acesso rápido
      </Text>

      <View style={styles.buttons}>

        <QuickAccessButton
          icon='medkit-outline'
          title='Vacinas'
          iconColor={COLORS.primary}
        />

        <QuickAccessButton
          icon="heart-outline"
          title="Doar sangue"
          iconColor={COLORS.danger}
        />

        <QuickAccessButton
          icon="search-outline"
          title="Serviços"
          iconColor={COLORS.blue}
        />

      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 25,
  },

  title: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 10,
  },

  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});