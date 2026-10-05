import React from 'react';

import {
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

interface TopicCardProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  color: string;
  onPress?: () => void;
}

export default function TopicCard({
  icon,
  title,
  color,
  onPress,
}: TopicCardProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >

      <Ionicons
        name={icon}
        size={21}
        color={color}
      />

      <Text style={styles.title}>
        {title}
      </Text>

    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,

    height: 64,

    backgroundColor: '#FFFFFF',

    borderWidth: 1,
    borderColor: '#DCE8E4',

    borderRadius: 12,

    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    fontSize: 9,

    fontWeight: '600',

    color: '#17343B',

    marginTop: 5,
  },
});