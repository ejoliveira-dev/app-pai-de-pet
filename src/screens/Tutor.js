import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function Tutor() {
    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.conteudo}
            showsVerticalScrollIndicator={false}
        >

            <Text style={styles.titulo}>
                Perfil do Tutor
            </Text>

            <Text style={styles.subtitulo}>
                Gerencie sua conta e seus pets.
            </Text>

            <View style={styles.card}>
                <Text style={styles.textoCard}>Meus dados</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.textoCard}>Meus Pets</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.textoCard}>Personalização</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.textoCard}>Notificações</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.textoCard}>Configurações</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.textoCard}>Sair da conta</Text>
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
        backgroundColor: '#FFEAC8',
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