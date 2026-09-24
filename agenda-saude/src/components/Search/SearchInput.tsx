import React from 'react';

import {
  View,
  TextInput,
  StyleSheet,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

interface SearchInputProps {
  placeholder?: string;
}

export default function SearchInput({
  placeholder = 'Vacina, posto, doação...',
}: SearchInputProps) {
  return (
    <View style={styles.container}>

      <Ionicons
        name="search-outline"
        size={18}
        color="#07805F"
      />

      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#89979A"
        style={styles.input}
      />

      <Ionicons
        name="options-outline"
        size={18}
        color="#7D898C"
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 46,

    backgroundColor: '#FFFFFF',

    borderWidth: 1,
    borderColor: '#DCE8E4',

    borderRadius: 12,

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 13,

    marginBottom: 14,
  },

  input: {
    flex: 1,

    fontSize: 11,

    color: '#17343B',

    marginHorizontal: 8,
  },
});