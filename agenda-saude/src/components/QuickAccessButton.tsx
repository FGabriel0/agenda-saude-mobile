import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../styles/theme';

interface QuickAccessButtonProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  iconColor: string;
}

export default function QuickAccessButton({ icon, title, iconColor }: QuickAccessButtonProps) {
  return (
    <TouchableOpacity style={styles.container}>

      <Ionicons
        name={icon}
        size={28}
        color={iconColor}
      />
      <Text style={styles.title}>
        {title}
      </Text>

    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '31.5%',
    height: 100,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  icon: {
    fontSize: 25,
    marginBottom: 8,
  },

  title: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
  },
});