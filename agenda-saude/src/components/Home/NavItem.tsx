import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';

import { useRouter } from 'expo-router';

import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../../styles/theme';

interface NavItemProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  route:string;
  active?: boolean;
}

export default function NavItem({
  icon,
  title,
  route,
  active = false,
}: NavItemProps) {

const router = useRouter();
  
  const handlePress = () => {
    router.push(route as any)
  };

  return (
    <TouchableOpacity style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}>

      <Ionicons
        name={icon}
        size={22}
        color={active ? COLORS.primary : '#7A898D'}
      />

      <Text
        style={[
          styles.title,
          active && styles.activeTitle,
        ]}
      >
        {title}
      </Text>

    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    color: '#7A898D',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 3,
  },

  activeTitle: {
    color: COLORS.primary,
  },
});