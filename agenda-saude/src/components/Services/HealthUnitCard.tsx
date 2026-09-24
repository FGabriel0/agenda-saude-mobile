import React from 'react';

import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
} from 'react-native';

interface HealthUnitCardProps {
  name: string;
  status: string;
  distance: string;
  information: string;
  onPress?: () => void;
}

export default function HealthUnitCard({
  name,
  status,
  distance,
  information,
  onPress,
}: HealthUnitCardProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >

      <View style={styles.header}>

        <Text
          style={styles.name}
          numberOfLines={1}
        >
          {name}
        </Text>

        <Text style={styles.status}>
          {status}
        </Text>

      </View>

      <Text style={styles.information}>
        {distance} • {information}
      </Text>

      <Text style={styles.link}>
        Ver serviços disponíveis ›
      </Text>

    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',

    borderWidth: 1,
    borderColor: '#DCE8E4',

    borderRadius: 13,

    padding: 13,

    marginBottom: 8,
  },

  header: {
    flexDirection: 'row',

    justifyContent: 'space-between',
    alignItems: 'center',
  },

  name: {
    flex: 1,

    fontSize: 12,
    fontWeight: '700',

    color: '#17343B',

    marginRight: 8,
  },

  status: {
    fontSize: 7,
    fontWeight: '800',

    color: '#07805F',
  },

  information: {
    fontSize: 9,

    color: '#718086',

    marginTop: 6,
  },

  link: {
    fontSize: 9,

    fontWeight: '600',

    color: '#07805F',

    marginTop: 8,
  },
});