import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';


import { COLORS } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';

export default function Calendar() {
  const dias: string[][] = [
    ['30', '31', '1', '2', '3', '4', '5'],
    ['6', '7', '8', '9', '10', '11', '12'],
    ['13', '14', '15', '16', '17', '18', '19'],
    ['20', '21', '22', '23', '24', '25', '26'],
    ['27', '28', '29', '30', '1', '2', '3'],
  ];

  const diasSemana: string[] = [
    'D',
    'S',
    'T',
    'Q',
    'Q',
    'S',
    'S',
  ];

  return (
    <View style={styles.calendar}>

      {/* Cabeçalho do calendário */}
      <View style={styles.calendarHeader}>

        <TouchableOpacity>
          <Ionicons
            name="chevron-back"
            size={16}
            color={COLORS.primary}
          />
        </TouchableOpacity>

        <Text style={styles.month}>
          Setembro 2026
        </Text>

        <TouchableOpacity>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={COLORS.primaryDark}
          />
        </TouchableOpacity>

      </View>

      {/* Dias da semana */}
      <View style={styles.week}>
        {diasSemana.map((dia, index) => (
          <Text
            key={index}
            style={styles.weekDay}
          >
            {dia}
          </Text>
        ))}
      </View>

      {/* Dias do mês */}
      {dias.map((semana, semanaIndex) => (
        <View
          key={semanaIndex}
          style={styles.week}
        >
          {semana.map((dia, index) => {

            const selecionado =
              dia === '14' &&
              semanaIndex === 2;

            const outroMes =
              (semanaIndex === 0 && index < 2) ||
              (semanaIndex === 4 && index > 3);

            return (
              <View
                key={index}
                style={[
                  styles.dayContainer,
                  selecionado && styles.selectedDay,
                ]}
              >
                <Text
                  style={[
                    styles.day,
                    outroMes && styles.otherMonth,
                    selecionado && styles.selectedText,
                  ]}
                >
                  {dia}
                </Text>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  calendar: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
  },

  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 7,
  },

  month: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },

  week: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 5,
  },

  weekDay: {
    width: 30,
    textAlign: 'center',
    fontSize: 8,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },

  dayContainer: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },

  day: {
    fontSize: 9,
    color: COLORS.text,
  },

  otherMonth: {
    color: COLORS.textSecondary,
  },

  selectedDay: {
    backgroundColor: COLORS.primary,
  },

  selectedText: {
    color: COLORS.white,
    fontWeight: '700',
  },
});