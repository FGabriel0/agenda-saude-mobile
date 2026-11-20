
import React, { useEffect, useRef, useState } from 'react';

import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';

import { COLORS } from '../../styles/theme';


const largura = Dimensions.get('window').width - 20;

type Campanha = {
  id: string;
  categoria: string;
  titulo: string;
  descricao: string;
  ativa: boolean;
};

type Props = {
  onVerCampanha?: (campanha: Campanha) => void;
};

const campanhas: Campanha[] = [
  {
    id: '1',
    categoria: 'VACINAÇÃO',
    titulo: 'Campanha contra a gripe',
    descricao:
      'Proteção para toda a comunidade.',
    ativa: true,
  },
  {
    id: '2',
    categoria: 'DOAÇÃO DE SANGUE',
    titulo: 'Doe sangue, compartilhe vida',
    descricao:
      'Uma única doação pode ajudar a salvar vidas.',
    ativa: true,
  },
  {
    id: '3',
    categoria: 'PREVENÇÃO',
    titulo: 'Cuide da sua Saúde',
    descricao:
      'Sua saúde importa.',
    ativa: true,
  },
];

export default function CampaignCard({
  onVerCampanha,
}: Props) {
  const listaRef = useRef<FlatList<Campanha>>(null);

  const campanhasAtivas = campanhas.filter(
    (campanha) => campanha.ativa
  );

  const [indiceAtual, setIndiceAtual] = useState(0);

  // Avanço automático a cada 4 segundos
  useEffect(() => {
    if (campanhasAtivas.length <= 1) return;

    const intervalo = setInterval(() => {
      setIndiceAtual((indiceAnterior) => {
        const proximo =
          (indiceAnterior + 1) % campanhasAtivas.length;

        listaRef.current?.scrollToIndex({
          index: proximo,
          animated: true,
        });

        return proximo;
      });
    }, 4000);

    return () => clearInterval(intervalo);
  }, [campanhasAtivas.length]);

  // Atualiza o indicador quando o usuário desliza manualmente
  function atualizarIndice(
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) {
    const offset = event.nativeEvent.contentOffset.x;

    const indice = Math.round(offset / largura);

    setIndiceAtual(indice);
  }

  if (campanhasAtivas.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={listaRef}
        data={campanhasAtivas}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={atualizarIndice}
        getItemLayout={(_, index) => ({
          length: largura,
          offset: largura * index,
          index,
        })}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <View style={styles.card}>
              <Text style={styles.tag}>
                {item.categoria}
              </Text>

              <Text style={styles.title}>
                {item.titulo}
              </Text>

              <Text style={styles.description}>
                {item.descricao}
              </Text>

              <TouchableOpacity
                style={styles.button}
                activeOpacity={0.8}
                onPress={() => onVerCampanha?.(item)}
              >
                <Text style={styles.buttonText}>
                  Ver campanha
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Indicadores do carrossel */}
      <View style={styles.indicadores}>
        {campanhasAtivas.map((item, index) => (
          <View
            key={item.id}
            style={[
              styles.indicador,
              indiceAtual === index &&
                styles.indicadorAtivo,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
 container: {
    backgroundColor: COLORS.primary,
    borderRadius: 15,
    padding: 18,
    height: 220,
    marginBottom: 25,
  },

  tag: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 15,
  },

  title: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 7,
    flexShrink: 1
  },

  description: {
    color: '#E6F7F2',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 1,
    flexShrink: 1,
  },

  button: {
    backgroundColor: COLORS.white,
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginTop: 12,
  },

  buttonText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '800',
  },


  slide: {
    width: largura,
    paddingHorizontal: 0,

  },

  card: {
    borderRadius: 17,
    padding: 17,
    justifyContent: 'center',
    width: '100%',
    minHeight: 200,
  },

  indicadores: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },

  indicador: {
    width: 7,
    height: 7,
    borderRadius: 5,
    backgroundColor: '#BCD5CE',
  },

  indicadorAtivo: {
    width: 19,
    backgroundColor: '#008767',
  },
});
