import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import NavItem from './NavItem';

import { COLORS } from '../styles/theme';

export default function BottomNavigation() {
  return (
    <View style={styles.container}>
      <NavItem
        icon="home-outline"
        title="Início"
        active
      />

      <NavItem
        icon="calendar-outline"
        title="Agenda"
      />

      <NavItem
        icon="search-outline"
        title="Buscar"
      />

      <NavItem
        icon="apps-outline"
        title="Serviços"
      />

      <NavItem
        icon="information-circle-outline"
        title="Informar"
      />

    </View>
  );
}



const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 12,
    left: 20,
    right: 20,

    height: 70,

    backgroundColor: COLORS.white,
    borderRadius: 18,

    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',

    elevation: 5,
  },

  item: {
    width: 60,
    alignItems: 'center',
  },

  icon: {
    color: '#7A898D',
    fontSize: 20,
    marginBottom: 3,
  },

  title: {
    color: '#7A898D',
    fontSize: 10,
    fontWeight: '600',
  },

  active: {
    color: COLORS.primary,
  },
});