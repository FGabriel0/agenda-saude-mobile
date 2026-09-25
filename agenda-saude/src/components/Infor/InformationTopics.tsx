import React from 'react';

import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

import TopicCard from './TopicCard';

export default function InformationTopics() {
  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        Explore por tema
      </Text>

      <View style={styles.cards}>

        <TopicCard
          icon="add-circle"
          title="Vacinação"
          color="#07805F"
        />

        <TopicCard
          icon="heart"
          title="Bem-estar"
          color="#E58A22"
        />

        <TopicCard
          icon="umbrella"
          title="Prevenção"
          color="#8152C7"
        />

      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 19,
  },

  title: {
    fontSize: 13,

    fontWeight: '700',

    color: '#102F38',

    marginBottom: 8,
  },

  cards: {
    flexDirection: 'row',

    gap: 8,
  },
});