import React from 'react';
import { StyleSheet, View } from 'react-native';

// OpenStreetMap: mapa interativo centralizado em Fortaleza.
// Este arquivo é escolhido automaticamente pelo Expo Web.
const MAP_URL =
  'https://www.openstreetmap.org/export/embed.html?bbox=-38.5700%2C-3.7800%2C-38.4800%2C-3.6900&layer=mapnik';

interface ServiceMapProps {
  onPress?: () => void; // Mantido por compatibilidade com o componente anterior.
}

export default function ServiceMap(_props: ServiceMapProps) {
  return (
    <View style={styles.container}>
      <iframe
        title="Mapa interativo de Fortaleza"
        src={MAP_URL}
        style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 170,
    marginBottom: 17,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D5E8E2',
    overflow: 'hidden',
    backgroundColor: '#E1F1ED',
  },
});
