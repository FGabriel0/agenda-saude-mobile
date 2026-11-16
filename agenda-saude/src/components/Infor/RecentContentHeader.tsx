import React from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

interface RecentContentHeaderProps {
  onSeeAll?: () => void;
}

export default function RecentContentHeader({
  onSeeAll,
}: RecentContentHeaderProps) {
  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        Conteúdos recentes
      </Text>

      <TouchableOpacity onPress={onSeeAll}>
        <Text style={styles.seeAll}>
          Ver todos
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

  seeAll: {
    fontSize: 9,

    fontWeight: '600',

    color: '#07805F',
  },
});