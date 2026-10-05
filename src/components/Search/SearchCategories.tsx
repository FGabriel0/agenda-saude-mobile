import React from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

export default function SearchCategories() {
  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        Categorias
      </Text>

      <View style={styles.buttons}>

        <TouchableOpacity
          style={[
            styles.button,
            styles.activeButton,
          ]}
        >
          <Text style={styles.activeText}>
            Tudo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button}>
          <Text style={styles.text}>
            Campanhas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button}>
          <Text style={styles.text}>
            Serviços
          </Text>
        </TouchableOpacity>

      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 11,
  },

  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#102F38',

    marginBottom: 8,
  },

  buttons: {
    flexDirection: 'row',
    gap: 7,
  },

  button: {
    height: 32,

    paddingHorizontal: 14,

    borderRadius: 16,

    borderWidth: 1,
    borderColor: '#DCE8E4',

    backgroundColor: '#FFFFFF',

    justifyContent: 'center',
    alignItems: 'center',
  },

  activeButton: {
    backgroundColor: '#07805F',
    borderColor: '#07805F',
  },

  text: {
    fontSize: 10,
    color: '#17343B',
  },

  activeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});