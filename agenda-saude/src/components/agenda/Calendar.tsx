import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { COLORS } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';

type CalendarProps = {
  onDateChange?: (date: Date) => void;
};

const meses = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const diasSemana = [
  'D',
  'S',
  'T',
  'Q',
  'Q',
  'S',
  'S',
];

export default function Calendar({
  onDateChange,
}: CalendarProps) {
  const [mesAtual, setMesAtual] = useState(8);
  const [anoAtual, setAnoAtual] = useState(2026);
  const [diaSelecionado, setDiaSelecionado] =
    useState(14);

  function mesAnterior() {
    if (mesAtual === 0) {
      setMesAtual(11);
      setAnoAtual((ano) => ano - 1);
    } else {
      setMesAtual((mes) => mes - 1);
    }
  }

  function proximoMes() {
    if (mesAtual === 11) {
      setMesAtual(0);
      setAnoAtual((ano) => ano + 1);
    } else {
      setMesAtual((mes) => mes + 1);
    }
  }

  function selecionarDia(dia: number) {
    setDiaSelecionado(dia);

    const data = new Date(
      anoAtual,
      mesAtual,
      dia
    );

    onDateChange?.(data);
  }

  function gerarDiasDoMes() {
    const primeiroDia = new Date(
      anoAtual,
      mesAtual,
      1
    ).getDay();

    const quantidadeDias = new Date(
      anoAtual,
      mesAtual + 1,
      0
    ).getDate();

    const dias: (number | null)[] = [];

    for (let i = 0; i < primeiroDia; i++) {
      dias.push(null);
    }

    for (
      let dia = 1;
      dia <= quantidadeDias;
      dia++
    ) {
      dias.push(dia);
    }

    while (dias.length % 7 !== 0) {
      dias.push(null);
    }

    return dias;
  }

  const dias = gerarDiasDoMes();

  return (
    <View style={styles.calendar}>

      {/* Cabeçalho */}
      <View style={styles.calendarHeader}>

        <TouchableOpacity onPress={mesAnterior}>
          <Ionicons
            name="chevron-back"
            size={16}
            color={COLORS.primary}
          />
        </TouchableOpacity>

        <Text style={styles.month}>
          {meses[mesAtual]} {anoAtual}
        </Text>

        <TouchableOpacity onPress={proximoMes}>
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

      {/* Dias */}
      <View style={styles.daysGrid}>

        {dias.map((dia, index) => {

          const selecionado =
            dia === diaSelecionado;

          return (
            <TouchableOpacity
              key={index}
              disabled={dia === null}
              onPress={() => {
                if (dia !== null) {
                  selecionarDia(dia);
                }
              }}
              style={[
                styles.dayContainer,
                selecionado &&
                  styles.selectedDay,
              ]}
            >

              {dia !== null && (
                <Text
                  style={[
                    styles.day,
                    selecionado &&
                      styles.selectedText,
                  ]}
                >
                  {dia}
                </Text>
              )}

            </TouchableOpacity>
          );
        })}

      </View>

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
    width: '14.28%',
    textAlign: 'center',
    fontSize: 8,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },

  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  dayContainer: {
    width: '14.28%',
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },

  day: {
    fontSize: 9,
    color: COLORS.text,
  },

  selectedDay: {
    backgroundColor: COLORS.primary,
  },

  selectedText: {
    color: COLORS.white,
    fontWeight: '700',
  },

});