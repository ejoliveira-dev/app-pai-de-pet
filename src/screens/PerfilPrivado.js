import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';

import RegistrosPet from '../componentes/RegistrosPet';
import VacinasPet from '../componentes/VacinasPet';
import CuidadosPet from '../componentes/CuidadosPet';

import TelaComTopo from '../componentes/TelaComTopo';
import Cartao from '../componentes/Cartao';
import Botao from '../componentes/Botao';
import Chip from '../componentes/Chip';
import AvatarPet from '../componentes/AvatarPet';
import { cores, fontes } from '../styles/tema';

import { useSQLiteContext } from 'expo-sqlite';
import { buscarPet, obterPetSelecionadoId } from '../database/Database';
import { useFocusEffect } from '@react-navigation/native';

export default function PerfilPrivado({ navigation }) {
    const db = useSQLiteContext();

    const [pet, setPet] = useState(null);
    const [carregando, setCarregando] = useState(true);

    useFocusEffect(
        useCallback(() => {
            let ativo = true;

            async function carregarPet() {
                if (ativo) setCarregando(true);

                try {
                    const idSelecionado = await obterPetSelecionadoId(db);

                    const petEncontrado = idSelecionado
                        ? await buscarPet(db, idSelecionado)
                        : null;

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

        }, [db])
    );

    return (
        <TelaComTopo
            titulo="Meu Pet"
            subtitulo="Saúde e rotina do seu companheiro."
        >

            {carregando ? (
                <View style={styles.carregando}>
                    <ActivityIndicator color={cores.laranja} size="large" />
                    <Text style={styles.detalhe}>
                        Carregando informações...
                    </Text>
                </View>
            ) : (
                <>
                    <Cartao style={styles.card}>

                        {pet ? (
                            <>
                                <View style={styles.linhaPet}>
                                    <AvatarPet
                                        foto={pet.foto_perfil}
                                        tamanho={84}
                                        selecionado
                                    />

                                    <View style={styles.infoPet}>
                                        <Text style={styles.textoCard} numberOfLines={1}>
                                            {pet.nome}
                                        </Text>

                                        <View style={styles.chips}>
                                            <Chip texto={pet.especie} icone="paw" />
                                            {!!pet.raca && <Chip texto={pet.raca} />}
                                        </View>
                                    </View>
                                </View>

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

                    </Cartao>

                    <Botao
                        titulo={pet ? "Trocar pet" : "Selecionar pet"}
                        icone="swap-horizontal"
                        larga
                        style={styles.botaoSelecionar}
                        onPress={() =>
                            navigation.getParent()?.navigate("ListaPets")
                        }
                    />
                </>
            )}

            <RegistrosPet />

            <VacinasPet />

            <CuidadosPet tipo="consulta" />

            <CuidadosPet tipo="medicamento" />

        </TelaComTopo>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: 4,
    },

    carregando: {
        alignItems: 'center',
        gap: 10,
        paddingVertical: 30,
    },

    linhaPet: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },

    infoPet: {
        flex: 1,
        gap: 8,
    },

    chips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },

    textoCard: {
        fontFamily: fontes.negrito,
        fontSize: 26,
        color: cores.marrom,
    },

    detalhe: {
        fontFamily: fontes.regular,
        fontSize: 16,
        color: cores.marromClaro,
        marginTop: 10,
    },

    botaoSelecionar: {
        marginTop: 14,
        marginBottom: 20,
    },
});