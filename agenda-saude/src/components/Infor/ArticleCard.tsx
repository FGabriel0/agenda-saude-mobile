import React from 'react';

import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

interface ArticleCardProps {
  category: string;
  title: string;
  description: string;
  categoryColor?: string;
  onPress?: () => void;
}

export default function ArticleCard({
  category,
  title,
  description,
  categoryColor = '#07805F',
  onPress,
}: ArticleCardProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >

      <Text
        style={[
          styles.category,
          {
            color: categoryColor,
          },
        ]}
      >
        {category}
      </Text>

      <Text style={styles.title}>
        {title}
      </Text>

      <Text style={styles.description}>
        {description}
      </Text>

      <View style={styles.footer}>

        <Text style={styles.link}>
          Ler em 3 min
        </Text>

        <Ionicons
          name="arrow-forward"
          size={12}
          color="#07805F"
        />

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

  category: {
    fontSize: 8,

    fontWeight: '800',

    marginBottom: 7,
  },

  title: {
    fontSize: 12,

    fontWeight: '700',

    color: '#17343B',
  },

  description: {
    fontSize: 9,

    lineHeight: 13,

    color: '#718086',

    marginTop: 5,
  },

  footer: {
    flexDirection: 'row',

    alignItems: 'center',

    gap: 4,

    marginTop: 8,
  },

  link: {
    fontSize: 9,

    fontWeight: '700',

    color: '#07805F',
  },
});