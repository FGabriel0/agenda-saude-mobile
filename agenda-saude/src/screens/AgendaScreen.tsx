import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    ScrollView,
    Text
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '@/styles/theme';

//Componentes da Agenda
import Header from '../components/Home/Header';
import Calendar from '../components/agenda/Calendar';
import FilterButton from '../components/agenda/FilterButton';
import AppointmentCard from '../components/agenda/AppointmentCard';
import BottomNavigation from '../components/Home/BottomNavigation';

import { appointments } from '../data/appointments';

type Filtro = 'Todos' | 'Vacinação' | 'Doação';


export default function AgendaScreen() {
    const [filtroSelecionado, setFiltroSelecionado] =
        useState<Filtro>('Todos');


        //Função de Filtro
    const compromissosFiltrados =
        filtroSelecionado === 'Todos'
            ? appointments
            : appointments.filter(
                (item) =>
                    item.tipo === filtroSelecionado
            );

    return (
        <SafeAreaView style={styles.container}>

            <View style={styles.content}>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={
                        styles.scrollContent
                    }
                >

                    {/* Cabeçalho */}
                    <Header
                        title='Agenda'
                        observation='Acompanhe as ações de saúde próximas a você' />

                    {/* Calendário */}
                    <Calendar />

                    {/* Filtros */}
                    <View style={styles.filters}>

                        <FilterButton
                            title="Todos"
                            active={
                                filtroSelecionado === 'Todos'
                            }
                            onPress={() =>
                                setFiltroSelecionado('Todos')
                            }
                        />

                        <FilterButton
                            title="Vacinação"
                            active={
                                filtroSelecionado === 'Vacinação'
                            }
                            onPress={() =>
                                setFiltroSelecionado(
                                    'Vacinação'
                                )
                            }
                        />

                        <FilterButton
                            title="Doação"
                            active={
                                filtroSelecionado === 'Doação'
                            }
                            onPress={() =>
                                setFiltroSelecionado('Doação')
                            }
                        />

                    </View>

                    {/* Data selecionada */}
                    <Text style={styles.dayTitle}>
                        Segunda, 14 de setembro
                    </Text>

                    {/* Compromissos */}
                    <View style={styles.appointments}>

                        {compromissosFiltrados.map(
                            (item) => (
                                <AppointmentCard
                                    key={item.id}
                                    horario={item.horario}
                                    titulo={item.titulo}
                                    local={item.local}
                                    cor={item.cor}
                                />
                            )
                        )}

                    </View>

                </ScrollView>

                {/* Menu inferior */}
                <BottomNavigation />

            </View>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },

    content: {
        flex: 1,
        paddingHorizontal: 16,
    },

    scrollContent: {
        paddingTop: 15,
        paddingBottom: 100,
    },

    filters: {
        flexDirection: 'row',
        marginTop: 10,
        marginBottom: 14,
        gap: 8,
    },

    dayTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 10,
    },

    appointments: {
        gap: 10,
    },

});