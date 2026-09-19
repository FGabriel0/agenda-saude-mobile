import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import { usePathname } from 'expo-router';

import { ROUTES } from '../../router/router';

import NavItem from './NavItem';

import { COLORS } from '../../styles/theme';

export default function BottomNavigation() {

  const pathname = usePathname();


  return (
    <View style={styles.container}>
      <NavItem
        icon="home-outline"
        title="Início"
        route={ROUTES.HOME}
        active={pathname === ROUTES.HOME}
      />

      <NavItem
        icon="calendar-outline"
        title="Agenda"
        route={ROUTES.AGENDA}
        active={pathname === ROUTES.AGENDA}
      />

      <NavItem
        icon="search-outline"
        title="Buscar"
        route={ROUTES.BUSCAR}
        active={pathname === ROUTES.BUSCAR}
      />

      <NavItem
        icon="apps-outline"
        title="Serviços"
        route={ROUTES.SERVICOS}
        active={pathname === ROUTES.SERVICOS}
      />

      <NavItem
        icon="information-circle-outline"
        title="Informar"
        route={ROUTES.INFORMAR}
        active={pathname === ROUTES.INFORMAR}
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