import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function PerfilPrivado() {
    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.conteudo}
            showsVerticalScrollIndicator={false}
        >

            <Text style={styles.titulo}>
                Meu Pet
            </Text>

            <Text style={styles.subtitulo}>
                Saúde e rotina do seu companheiro.
            </Text>

            <View style={styles.card}>
                <Text style={styles.textoCard}>Alimentação</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.textoCard}>Peso</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.textoCard}>Vacinas</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.textoCard}>Consultas</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.textoCard}>Medicamentos</Text>
            </View>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFDF8',
    },

    conteudo: {
        padding: 25,
        paddingTop: 45,
        paddingBottom: 35,
    },

    titulo: {
        fontFamily: 'Ruwudu-Bold',
        fontSize: 32,
        color: '#332716',
    },

    subtitulo: {
        fontFamily: 'Ruwudu-Regular',
        fontSize: 18,
        color: '#75571F',
        marginBottom: 25,
    },

    card: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#FA9F2A',
        borderRadius: 20,
        padding: 20,
        marginBottom: 15,
    },

    textoCard: {
        fontFamily: 'Ruwudu-Bold',
        fontSize: 20,
        color: '#332716',
    },
});