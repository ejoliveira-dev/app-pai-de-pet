import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';

import RegistrosPet from '../componentes/RegistrosPet';
import VacinasPet from '../componentes/VacinasPet';
import CuidadosPet from '../componentes/CuidadosPet';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

export default function PerfilPrivado({ navigation }) {

    const [pet, setPet] = useState(null);
    const [carregando, setCarregando] = useState(true);

    useFocusEffect(
        useCallback(() => {
            let ativo = true;

            async function carregarPet() {
                if (ativo) setCarregando(true);

                try {
                    const idSelecionado = await AsyncStorage.getItem(
                        "@tutus:petSelecionadoId"
                    );

                    const dadosSalvos = await AsyncStorage.getItem(
                        "@tutus:pets"
                    );

                    const lista = dadosSalvos
                        ? JSON.parse(dadosSalvos)
                        : [];

                    if (!Array.isArray(lista)) {
                        throw new Error("Lista de pets inválida");
                    }

                    const petEncontrado = lista.find(
                        (item) =>
                            idSelecionado !== null &&
                            String(item.id_pet) === idSelecionado
                    );

                    if (ativo) {
                        setPet(petEncontrado || null);
                    }

                } catch (erro) {
                    console.error("Erro ao carregar pet:", erro);

                    if (ativo) {
                        setPet(null);
                        Alert.alert(
                            "Erro",
                            "Não foi possível carregar os dados do pet."
                        );
                    }
                } finally {
                    if (ativo) setCarregando(false);
                }
            }

            carregarPet();

            return () => {
                ativo = false;
            };

        }, [])
    );

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

            {carregando ? (
                <Text style={styles.detalhe}>
                    Carregando informações...
                </Text>
            ) : (
                <>
                    <View style={styles.card}>

                        {pet ? (
                            <>
                                {pet.foto_perfil && (
                                    <Image
                                        source={{ uri: pet.foto_perfil }}
                                        style={styles.fotoPet}
                                    />
                                )}

                                <Text style={styles.textoCard}>
                                    {pet.nome}
                                </Text>

                                <Text style={styles.detalhe}>
                                    Espécie: {pet.especie}
                                </Text>

                                <Text style={styles.detalhe}>
                                    Raça: {pet.raca || "Não informada"}
                                </Text>

                                <Text style={styles.detalhe}>
                                    {pet.data_nascimento
                                        ? `Nascimento: ${pet.data_nascimento}`
                                        : `Idade: ${pet.idade_Aproximada || "Não informada"}`}
                                </Text>

                                {pet.observacoes ? (
                                    <Text style={styles.detalhe}>
                                        Observações: {pet.observacoes}
                                    </Text>
                                ) : null}
                            </>
                        ) : (
                            <Text style={styles.detalhe}>
                                Nenhum pet selecionado.
                            </Text>
                        )}

                    </View>

                    <TouchableOpacity
                        style={styles.botaoSelecionar}
                        onPress={() =>
                            navigation.getParent()?.navigate("ListaPets")
                        }
                    >
                        <Text style={styles.textoBotao}>
                            {pet ? "Trocar Pet" : "Selecionar Pet"}
                        </Text>
                    </TouchableOpacity>
                </>
            )}

           <RegistrosPet />

           <VacinasPet />

            <CuidadosPet tipo="consulta" />

            <CuidadosPet tipo="medicamento" />

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

    fotoPet: {
        width: 90,
        height: 90,
        borderRadius: 45,
        marginBottom: 12,
    },

    detalhe: {
        fontFamily: 'Ruwudu-Regular',
        fontSize: 16,
        color: '#75571F',
        marginTop: 8,
    },

    botaoSelecionar: {
        backgroundColor: '#FA9F2A',
        padding: 15,
        borderRadius: 15,
        alignItems: 'center',
        marginBottom: 25,
    },

    textoBotao: {
        fontFamily: 'Ruwudu-Bold',
        fontSize: 18,
        color: '#332716',
    },
});