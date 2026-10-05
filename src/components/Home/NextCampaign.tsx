import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import { COLORS } from '../../styles/theme';

export default function NextCampaign() {
  return (
    <View>

      <View style={styles.header}>
        <Text style={styles.title}>
          Próximas campanhas
        </Text>

        <TouchableOpacity>
          <Text style={styles.seeAll}>
            Ver todas
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.card}>

        <View style={styles.date}>
          <Text style={styles.number}>
            14
          </Text>

          <Text style={styles.month}>
            SET
          </Text>
        </View>

        <View style={styles.info}>

          <Text style={styles.campaignTitle}>
            Doe sangue, compartilhe vida
          </Text>

          <Text style={styles.description}>
            09h–16h • Hemoce Fortaleza
          </Text>

        </View>

      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  title: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
  },

  seeAll: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },

  card: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 15,
    minHeight: 100,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  date: {
    width: 65,
    height: 65,
    borderRadius: 15,
    backgroundColor: COLORS.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  number: {
    color: COLORS.danger,
    fontSize: 24,
    fontWeight: '900',
  },

  month: {
    color: COLORS.danger,
    fontSize: 11,
    fontWeight: '800',
  },

  info: {
    flex: 1,
  },

  campaignTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 5,
  },

  description: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
});