import React from 'react';

import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

interface SearchResultCardProps {
  type: string;
  title: string;
  information: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  onPress?: () => void;
}

export default function SearchResultCard({
  type,
  title,
  information,
  icon = 'location-outline',
  onPress,
}: SearchResultCardProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >

      <Text style={styles.type}>
        {type}
      </Text>

      <Text style={styles.title}>
        {title}
      </Text>

      <View style={styles.info}>

        <Ionicons
          name={icon}
          size={13}
          color="#718086"
        />

        <Text style={styles.information}>
          {information}
        </Text>

      </View>

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

  type: {
    fontSize: 8,
    fontWeight: '800',

    color: '#07805F',

    marginBottom: 6,
  },

  title: {
    fontSize: 12,
    fontWeight: '700',

    color: '#17343B',
  },

  info: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 4,

    marginTop: 7,
  },

  information: {
    fontSize: 9,
    color: '#718086',
  },
});