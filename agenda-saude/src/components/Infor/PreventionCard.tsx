import React from 'react';

import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

interface PreventionCardProps {
  title: string;
  description: string;
  onPress?: () => void;
}

export default function PreventionCard({
  title,
  description,
  onPress,
}: PreventionCardProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.85}
    >

      <Text style={styles.category}>
        PREVENÇÃO
      </Text>

      <Text style={styles.title}>
        {title}
      </Text>

      <Text style={styles.description}>
        {description}
      </Text>

      <View style={styles.readMore}>
        <Text style={styles.readMoreText}>
          Ler orientações
        </Text>

        <Ionicons
          name="arrow-forward"
          size={12}
          color="#FFFFFF"
        />
      </View>

    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#247CBA',

    minHeight: 117,

    borderRadius: 15,

    padding: 16,

    marginBottom: 18,
  },

  category: {
    fontSize: 8,
    fontWeight: '800',

    color: '#DDEFFF',

    marginBottom: 8,
  },

  title: {
    fontSize: 16,
    lineHeight: 19,

    fontWeight: '800',

    color: '#FFFFFF',

    maxWidth: '90%',
  },

  description: {
    fontSize: 10,
    lineHeight: 14,

    color: '#EFF8FF',

    marginTop: 6,

    maxWidth: '90%',
  },

  readMore: {
    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'flex-end',

    gap: 4,

    marginTop: 5,
  },

  readMoreText: {
    fontSize: 9,

    fontWeight: '700',

    color: '#FFFFFF',
  },
});