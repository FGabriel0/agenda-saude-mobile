
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '../../styles/theme';

type CalendarProps = {
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
};

const meses = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril',
  'Maio', 'Junho', 'Julho', 'Agosto',
  'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const diasSemana = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function mesmoDia(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function Calendar({
  selectedDate,
  onDateChange,
}: CalendarProps) {
  const [hoje, setHoje] = useState(() => new Date());

  const [dataInterna, setDataInterna] = useState(
    () => selectedDate ?? new Date()
  );

  const dataSelecionada = selectedDate ?? dataInterna;

  const [mesVisivel, setMesVisivel] = useState(
    () => new Date(
      dataSelecionada.getFullYear(),
      dataSelecionada.getMonth(),
      1
    )
  );

  useEffect(() => {
    setMesVisivel(
      new Date(
        dataSelecionada.getFullYear(),
        dataSelecionada.getMonth(),
        1
      )
    );
  }, [
    dataSelecionada.getFullYear(),
    dataSelecionada.getMonth(),
  ]);

  useEffect(() => {
    const intervalo = setInterval(() => {
      setHoje(new Date());
    }, 60000);

    return () => clearInterval(intervalo);
  }, []);

  function mudarMes(diferenca: number) {
    setMesVisivel(anterior =>
      new Date(
        anterior.getFullYear(),
        anterior.getMonth() + diferenca,
        1
      )
    );
  }

  function selecionarDia(dia: number) {
    const data = new Date(
      mesVisivel.getFullYear(),
      mesVisivel.getMonth(),
      dia
    );

    setDataInterna(data);
    onDateChange?.(data);
  }

  function voltarParaHoje() {
    const agora = new Date();
    setHoje(agora);
    setDataInterna(agora);
    setMesVisivel(
      new Date(agora.getFullYear(), agora.getMonth(), 1)
    );
    onDateChange?.(agora);
  }

  const ano = mesVisivel.getFullYear();
  const mes = mesVisivel.getMonth();

  const primeiroDia = new Date(ano, mes, 1).getDay();
  const quantidadeDias = new Date(ano, mes + 1, 0).getDate();

  const dias: (number | null)[] = [
    ...Array.from({ length: primeiroDia }, () => null),
    ...Array.from(
      { length: quantidadeDias },
      (_, indice) => indice + 1
    ),
  ];

  while (dias.length % 7 !== 0) {
    dias.push(null);
  }

  return (
    <View style={styles.calendar}>
      <View style={styles.calendarHeader}>
        <TouchableOpacity onPress={() => mudarMes(-1)}>
          <Ionicons
            name="chevron-back"
            size={20}
            color={COLORS.primary}
          />
        </TouchableOpacity>

        <Text style={styles.month}>
          {meses[mes]} {ano}
        </Text>

        <TouchableOpacity onPress={() => mudarMes(1)}>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={COLORS.primary}
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={voltarParaHoje}
        style={styles.todayButton}
      >
        <Text style={styles.todayButtonText}>Ir para hoje</Text>
      </TouchableOpacity>

      <View style={styles.week}>
        {diasSemana.map((dia, indice) => (
          <Text key={indice} style={styles.weekDay}>
            {dia}
          </Text>
        ))}
      </View>

      <View style={styles.daysGrid}>
        {dias.map((dia, indice) => {
          const data = dia === null
            ? null
            : new Date(ano, mes, dia);

          const selecionado =
            data !== null &&
            mesmoDia(data, dataSelecionada);

          const ehHoje =
            data !== null &&
            mesmoDia(data, hoje);

          return (
            <TouchableOpacity
              key={indice}
              disabled={dia === null}
              onPress={() => {
                if (dia !== null) selecionarDia(dia);
              }}
              style={[
                styles.dayContainer,
                ehHoje && styles.today,
                selecionado && styles.selectedDay,
              ]}
            >
              {dia !== null && (
                <Text
                  style={[
                    styles.day,
                    ehHoje && styles.todayText,
                    selecionado && styles.selectedText,
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
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  todayButton: {
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  todayButtonText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  week: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 5,
  },
  weekDay: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayContainer: {
    width: '14.28%',
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  day: {
    fontSize: 12,
    color: COLORS.text,
  },
  today: {
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  todayText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  selectedDay: {
    backgroundColor: COLORS.primary,
  },
  selectedText: {
    color: COLORS.white,
    fontWeight: '700',
  },
});
