
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';

type Unidade = {
  id: number;
  nome: string;
  tipo: string;
  endereco: string;
  cor: string;
  x: number;
  y: number;
};

const unidades: Unidade[] = [
  {
    id: 1,
    nome: 'Hospital São Lucas',
    tipo: 'Hospital',
    endereco: 'Av. Central, 456 - Centro',
    cor: '#E5484D',
    x: '34%' as unknown as number,
    y: '24%' as unknown as number,
  },
  {
    id: 2,
    nome: 'UBS Jardim das Flores',
    tipo: 'Posto de saúde',
    endereco: 'R. dos Ipês, 78 - Jardim das Flores',
    cor: '#2878D0',
    x: '53%' as unknown as number,
    y: '35%' as unknown as number,
  },
  {
    id: 3,
    nome: 'Posto Vila do Sol',
    tipo: 'Posto de saúde',
    endereco: 'R. das Flores, 123 - Vila do Sol',
    cor: '#2878D0',
    x: '70%' as unknown as number,
    y: '53%' as unknown as number,
  },
  {
    id: 4,
    nome: 'Farmácia Popular',
    tipo: 'Farmácia',
    endereco: 'Av. Sul, 210 - Centro',
    cor: '#15966B',
    x: '42%' as unknown as number,
    y: '67%' as unknown as number,
  },
  {
    id: 5,
    nome: 'UBS Nova Esperança',
    tipo: 'Posto de saúde',
    endereco: 'R. das Acácias, 90',
    cor: '#2878D0',
    x: '14%' as unknown as number,
    y: '47%' as unknown as number,
  },
];

export default function MapaUnidades() {
  const [selecionada, setSelecionada] =
    useState<Unidade | null>(null);

  return (
    <View style={styles.container}>
      {/* Mapa fictício */}
      <View style={styles.map}>
        {/* Áreas verdes */}
        <View style={[styles.park, {
          top: -20, left: -20, width: 130, height: 100,
        }]} />
        <View style={[styles.park, {
          top: 100, right: 20, width: 100, height: 120,
        }]} />
        <View style={[styles.park, {
          bottom: 5, left: 90, width: 85, height: 55,
        }]} />

        {/* Quadras */}
        {Array.from({ length: 7 }).map((_, i) => (
          <View
            key={`quadra-${i}`}
            style={[
              styles.block,
              {
                top: 35 + i * 42,
                left: 10 + (i % 3) * 105,
              },
            ]}
          />
        ))}

        {/* Ruas horizontais */}
        {Array.from({ length: 6 }).map((_, i) => (
          <View
            key={`rua-h-${i}`}
            style={[
              styles.roadHorizontal,
              { top: 25 + i * 60 },
            ]}
          />
        ))}

        {/* Ruas verticais */}
        {Array.from({ length: 5 }).map((_, i) => (
          <View
            key={`rua-v-${i}`}
            style={[
              styles.roadVertical,
              { left: 25 + i * 78 },
            ]}
          />
        ))}

        {/* Avenida principal */}
        <View style={styles.mainRoad} />
        <Text style={styles.roadLabel}>Av. Central</Text>
        <Text style={[styles.roadLabel, {
          top: '43%', left: '8%',
        }]}>
          R. das Acácias
        </Text>
        <Text style={[styles.roadLabel, {
          top: '76%', left: '48%',
        }]}>
          Av. Sul
        </Text>

        {/* Parque */}
        <Text style={styles.parkLabel}>🌳</Text>
        <Text style={styles.parkName}>Parque da Cidade</Text>

        {/* Localização atual fictícia */}
        <View style={styles.currentLocation}>
          <View style={styles.currentDot} />
        </View>

        {/* Unidades de saúde */}
        {unidades.map((unidade) => (
          <Pressable
            key={unidade.id}
            onPress={() => setSelecionada(unidade)}
            style={[
              styles.marker,
              {
                left: `${unidade.x}` as `${number}%`,
                top: `${unidade.y}` as `${number}%`,
              },
            ]}
          >
            <View style={[
              styles.markerIcon,
              { backgroundColor: unidade.cor },
            ]}>
              <Text style={styles.markerPlus}>+</Text>
            </View>
            <Text style={styles.markerLabel}>
              {unidade.nome}
            </Text>
          </Pressable>
        ))}

        {/* Identificação do mapa */}
        <View style={styles.mapBadge}>
          <Text style={styles.mapBadgeText}>
            📍 Mapa fictício · Agenda Saúde
          </Text>
        </View>
      </View>

      {/* Detalhes da unidade selecionada */}
      {selecionada && (
        <View style={styles.details}>
          <Pressable
            onPress={() => setSelecionada(null)}
            style={styles.close}
          >
            <Text style={styles.closeText}>✕</Text>
          </Pressable>

          <Text style={styles.detailsTitle}>
            {selecionada.nome}
          </Text>
          <Text style={styles.detailsType}>
            {selecionada.tipo}
          </Text>
          <Text style={styles.detailsAddress}>
            📍 {selecionada.endereco}
          </Text>
          <Text style={styles.fakeNotice}>
            Unidade demonstrativa — dados fictícios
          </Text>
        </View>
      )}

      {/* Legenda */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>
          Unidades no mapa
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          <Text style={styles.legendItem}>
            🔵 Postos de saúde
          </Text>
          <Text style={styles.legendItem}>
            🔴 Hospital
          </Text>
          <Text style={styles.legendItem}>
            🟢 Farmácia
          </Text>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#F0F7F4',
    borderRadius: 18,
    overflow: 'hidden',
  },
  map: {
    height: 360,
    width: '100%',
    backgroundColor: '#F4F1E9',
    overflow: 'hidden',
    position: 'relative',
  },
  park: {
    position: 'absolute',
    backgroundColor: '#D6EEC1',
    borderRadius: 25,
  },
  block: {
    position: 'absolute',
    width: 48,
    height: 27,
    backgroundColor: '#E9E6DD',
    borderRadius: 4,
  },
  roadHorizontal: {
    position: 'absolute',
    left: -20,
    right: -20,
    height: 13,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2DED5',
  },
  roadVertical: {
    position: 'absolute',
    top: -20,
    bottom: -20,
    width: 13,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E2DED5',
  },
  mainRoad: {
    position: 'absolute',
    left: '36%',
    top: -20,
    height: 420,
    width: 17,
    backgroundColor: '#FFE4A3',
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: '#F5C76A',
    transform: [{ rotate: '12deg' }],
  },
  roadLabel: {
    position: 'absolute',
    top: '27%',
    left: '38%',
    color: '#46515A',
    fontSize: 10,
    fontWeight: '600',
    backgroundColor: '#FFFFFFCC',
  },
  parkLabel: {
    position: 'absolute',
    top: '35%',
    right: '15%',
    fontSize: 23,
  },
  parkName: {
    position: 'absolute',
    top: '43%',
    right: '7%',
    fontSize: 10,
    color: '#347447',
    fontWeight: '600',
  },
  currentLocation: {
    position: 'absolute',
    left: '47%',
    top: '51%',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#2388F533',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentDot: {
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: '#1686F5',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  marker: {
    position: 'absolute',
    width: 100,
    alignItems: 'flex-start',
  },
  markerIcon: {
    width: 29,
    height: 29,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    transform: [{ rotate: '-45deg' }],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  markerPlus: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    transform: [{ rotate: '45deg' }],
    lineHeight: 25,
  },
  markerLabel: {
    color: '#183B60',
    backgroundColor: '#FFFFFFE8',
    fontSize: 10,
    fontWeight: '700',
    padding: 2,
    borderRadius: 3,
    marginTop: 2,
    maxWidth: 100,
  },
  mapBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#FFFFFFE8',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 18,
  },
  mapBadgeText: {
    color: '#164653',
    fontSize: 11,
    fontWeight: '600',
  },
  details: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#DCE9E5',
  },
  close: {
    position: 'absolute',
    right: 12,
    top: 10,
    padding: 5,
  },
  closeText: {
    color: '#52656A',
    fontSize: 18,
  },
  detailsTitle: {
    color: '#123E46',
    fontSize: 17,
    fontWeight: 'bold',
    paddingRight: 25,
  },
  detailsType: {
    color: '#218B71',
    marginTop: 4,
  },
  detailsAddress: {
    color: '#607A86',
    marginTop: 8,
  },
  fakeNotice: {
    fontSize: 11,
    color: '#89979B',
    marginTop: 8,
  },
  legend: {
    padding: 14,
  },
  legendTitle: {
    color: '#123E46',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  legendItem: {
    color: '#49646A',
    marginRight: 18,
    fontSize: 12,
  },
});
