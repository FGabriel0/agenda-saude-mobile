import React from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

interface NearbyHeaderProps {
  onOrderPress?: () => void;
}

export default function NearbyHeader({
  onOrderPress,
}: NearbyHeaderProps) {
  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        Unidades próximas
      </Text>

      <TouchableOpacity onPress={onOrderPress}>
        <Text style={styles.order}>
          Ordenar⌄
        </Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',

    justifyContent: 'space-between',
    alignItems: 'center',

    marginBottom: 8,
  },

  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#102F38',
  },

  order: {
    fontSize: 9,
    fontWeight: '600',
    color: '#07805F',
  },
});