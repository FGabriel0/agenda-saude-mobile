
import {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import type { CampanhaHome } from '../../screens/HomeScreen';
import { COLORS } from '../../styles/theme';

type Props = {
  campanhas: CampanhaHome[];
  onVerCampanha?: (campanha: CampanhaHome) => void;
};

export default function CampaignCard({
  campanhas,
  onVerCampanha,
}: Props) {
  const listaRef =
    useRef<FlatList<CampanhaHome>>(null);

  const { width } = useWindowDimensions();

  const [larguraLista, setLarguraLista] =
    useState(0);

  const [indiceAtual, setIndiceAtual] =
    useState(0);

  useEffect(() => {
    setIndiceAtual(0);

    if (larguraLista > 0) {
      listaRef.current?.scrollToOffset({
        offset: 0,
        animated: false,
      });
    }
  }, [campanhas, larguraLista]);

  useEffect(() => {
    if (
      campanhas.length <= 1 ||
      larguraLista <= 0
    ) {
      return;
    }

    const intervalo = setInterval(() => {
      setIndiceAtual(indiceAnterior => {
        const proximo =
          (indiceAnterior + 1) %
          campanhas.length;

        listaRef.current?.scrollToOffset({
          offset: proximo * larguraLista,
          animated: true,
        });

        return proximo;
      });
    }, 4000);

    return () => clearInterval(intervalo);
  }, [campanhas.length, larguraLista]);

  function atualizarIndice(
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) {
    if (larguraLista <= 0) return;

    const offset =
      event.nativeEvent.contentOffset.x;

    const indice = Math.round(
      offset / larguraLista
    );

    setIndiceAtual(
      Math.max(
        0,
        Math.min(indice, campanhas.length - 1)
      )
    );
  }

  if (campanhas.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View
        style={styles.carouselArea}
        onLayout={event => {
          setLarguraLista(
            event.nativeEvent.layout.width
          );
        }}
      >
        {larguraLista > 0 && (
          <FlatList
            ref={listaRef}
            data={campanhas}
            keyExtractor={item => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={atualizarIndice}
            getItemLayout={(_, index) => ({
              length: larguraLista,
              offset: larguraLista * index,
              index,
            })}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.slide,
                  { width: larguraLista },
                ]}
              >
                <Text style={styles.tag}>
                  {item.categoria || 'SAÚDE'}
                </Text>

                <Text
                  style={styles.title}
                  numberOfLines={2}
                >
                  {item.titulo}
                </Text>

                <Text
                  style={styles.description}
                  numberOfLines={2}
                >
                  {item.descricao ||
                    'Participe desta campanha de saúde.'}
                </Text>

                <TouchableOpacity
                  style={styles.button}
                  activeOpacity={0.8}
                  onPress={() =>
                    onVerCampanha?.(item)
                  }
                >
                  <Text style={styles.buttonText}>
                    Ver campanha
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>

      <View style={styles.indicadores}>
        {campanhas.map((item, index) => (
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
    overflow: 'hidden',
  },

  carouselArea: {
    flex: 1,
    width: '100%',
  },

  slide: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },

  tag: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 12,
  },

  title: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 7,
    flexShrink: 1,
  },

  description: {
    color: '#E6F7F2',
    fontSize: 12,
    lineHeight: 18,
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
    backgroundColor: COLORS.white,
  },
});
