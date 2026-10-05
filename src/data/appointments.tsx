
//Apenas um Banco ficticio para o front

export interface Appointment {
  id: number;
  horario: string;
  titulo: string;
  local: string;
  tipo: 'Doação' | 'Vacinação';
  cor: string;
}

import { COLORS } from "@/styles/theme";

export const appointments: Appointment[] = [
  {
    id: 1,
    horario: '09:00',
    titulo: 'Doação de sangue',
    local: 'Hemocentro Fortaleza',
    tipo: 'Doação',
    cor: COLORS.danger,
  },
  {
    id: 2,
    horario: '14:00',
    titulo: 'Vacinação contra gripe',
    local: 'Posto de Saúde Edmar Fujita',
    tipo: 'Vacinação',
    cor: COLORS.primary,
  },
];