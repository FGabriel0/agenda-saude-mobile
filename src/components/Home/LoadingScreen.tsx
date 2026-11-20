
import React, { useEffect, useRef } from 'react';

import {
  View,
  Modal,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';

type Props = {
  visible: boolean;
};

export default function LoadingScreen({ visible }: Props) {
  const escala = useRef(new Animated.Value(1)).current;

  const batimento = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    const pulsar = Animated.loop(
      Animated.sequence([
        Animated.timing(escala, {
          toValue: 1.15,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(escala, {
          toValue: 1,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const sinal = Animated.loop(
      Animated.sequence([
        Animated.timing(batimento, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(batimento, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );

    pulsar.start();
    sinal.start();

    return () => {
      pulsar.stop();
      sinal.stop();
    };
  }, [visible]);

  const deslocamento = batimento.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.container}>

        {/* Cruz médica */}
        <Animated.View
          style={[
            styles.cruz,
            { transform: [{ scale: escala }] },
          ]}
        >
          <View style={styles.vertical} />
          <View style={styles.horizontal} />
        </Animated.View>

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#008767',
    justifyContent: 'center',
    alignItems: 'center',
  },

  cruz: {
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 35,
  },

  vertical: {
    position: 'absolute',
    width: 19,
    height: 75,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },

  horizontal: {
    position: 'absolute',
    width: 75,
    height: 19,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },

});