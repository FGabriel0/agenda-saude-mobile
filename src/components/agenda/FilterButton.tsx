import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';

import { COLORS } from '@/styles/theme';

interface FilterButtonProps {
  title: string;
  active: boolean;
  onPress: () => void;
}

export default function FilterButton({
  title,
  active,
  onPress,
}: FilterButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.button,
        active && styles.activeButton,
      ]}
    >
      <Text
        style={[
          styles.text,
          active && styles.activeText,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 28,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  activeButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryDark,
  },

  text: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },

  activeText: {
    color: COLORS.white,
  },
});