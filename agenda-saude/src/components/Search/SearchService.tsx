import React from 'react';

import {
  View,
  TextInput,
  StyleSheet,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

export default function SearchService() {
  return (
    <View style={styles.container}>

      <Ionicons
        name="search-outline"
        size={18}
        color="#07805F"
      />

      <TextInput
        placeholder="Buscar unidade ou serviço"
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

    marginBottom: 11,
  },

  input: {
    flex: 1,

    fontSize: 11,

    color: '#17343B',

    marginHorizontal: 8,
  },
});