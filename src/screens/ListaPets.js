import React, { useState, useCallback } from "react";
import { View, Text, Image, TouchableOpacity, Pressable, ScrollView, FlatList, Alert } from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

import { Ionicons } from '@expo/vector-icons';
import { style } from "../../src/styles/ListaPetsStyles";

import logo from "../../assets/images/logo-ofc-png-empty2.png";

const cores = {
    fundo: "#FFFDF8",
    laranja: "#FA9F2A",
    marrom: "#332716",
};

export default function ListaPets({ navigation }) {

    const [pets, setPets] = useState([]);
    const [petSelecionado, setPetSelecionado] = useState(null);

    const [carregando, setCarregando] = useState(true);
    // controla o carregamento dos dados

    // busca os pets salvos
    useFocusEffect(
        useCallback(() => {
            let ativo = true;

            async function carregarPets() {
                setCarregando(true);

                try {
                    const dadosSalvos = await AsyncStorage.getItem("@tutus:pets");

                    const lista = dadosSalvos ? JSON.parse(dadosSalvos) : [];

                    if (ativo) {
                        const listaValida = Array.isArray(lista) ? lista : [];

                        setPets(listaValida);

                        setPetSelecionado((atual) => {
                            if (listaValida.length === 0) {
                                return null;
                            }

                            // mantém a seleção atual, se o pet ainda existir.
                            const petAtual = listaValida.find(
                                (pet) => pet.id_pet === atual?.id_pet
                            );

                            return petAtual || listaValida[0];
                        });
                    }
                } catch (erro) {
                    if (ativo) {
                        Alert.alert(
                            "Ops!",
                            "Não foi possível carregar os pets cadastrados."
                        );
                    }
                } finally {
                    if (ativo) {
                        setCarregando(false);
                    }
                }
            }

            carregarPets();

            return () => {
                ativo = false;
            };

        }, [])
    );

    // abre a área principal com o pet escolhido.
    function abrirPet(pet) {
        navigation.navigate("MainTabs", {
            screen: "Inicio",
            params: {
                petSelecionado: pet,
            },
        });
    }

    // abre o formulário de cadastro.
    function adicionarPet() {
        navigation.navigate("CadastroPets");
    }

    // cada pet aparece como um avatar circular na roleta.
    function renderizarPet({ item }) {
        const selecionado =
            petSelecionado?.id_pet === item.id_pet;

        return (
            <TouchableOpacity
                style={style.itemRoleta}
                onPress={() => setPetSelecionado(item)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={`Selecionar ${item.nome}`}
                accessibilityState={{ selected: selecionado }}
            >
                <View
                    style={[
                        style.avatarBorda,
                        selecionado && style.avatarSelecionado,
                    ]}
                >
                    {item.foto_perfil ? (
                        <Image
                            source={{ uri: item.foto_perfil }}
                            style={style.avatarImagem}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={style.avatarSemFoto}>
                            <Ionicons
                                name="paw"
                                size={30}
                                color={cores.laranja}
                            />
                        </View>
                    )}
                </View>

                <Text
                    numberOfLines={1}
                    style={[
                        style.nomeRoleta,
                        selecionado && style.nomeRoletaSelecionado,
                    ]}
                >
                    {item.nome || "Meu pet"}
                </Text>

                {selecionado && (
                    <View style={style.indicadorSelecionado} />
                )}
            </TouchableOpacity>
        );
    }

    function renderizarBotaoAdicionar() {
        return (
            <TouchableOpacity
                style={style.itemRoleta}
                onPress={adicionarPet}
                activeOpacity={0.7}
            >
                <View style={style.avatarAdicionar}>
                    <Ionicons name="paw" size={28} color={cores.laranja} />

                    <View style={style.iconeMais}>
                        <Ionicons name="add" size={16} color={cores.fundo} />
                    </View>
                </View>

                <Text style={style.nomeRoleta}>
                    Adicionar
                </Text>
            </TouchableOpacity>
        );
    }


    return (
        <View style={style.container}>
            <View style={style.topoCirculo} />
            <View style={style.topoLaranja}>
                <Text style={style.saudacao}>
                    Olá, Tutor!
                </Text>
            </View>

            <View style={style.painelBranco}>
                <ScrollView
                    style={style.scroll}
                    contentContainerStyle={style.conteudo}
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={style.titulo}>
                        De quem vamos cuidar hoje?
                    </Text>

                    <Text style={style.subtitulo}>
                        Escolha seu companheiro:
                    </Text>

                    {carregando ? (
                        <View style={style.estadoVazio}>
                            <Ionicons
                                name="paw"
                                size={42}
                                color={cores.laranja}
                            />

                            <Text style={style.textoEstado}>
                                Procurando seus companheiros...
                            </Text>
                        </View>
                    ) : (
                        <>
                            {/* roleta horizontal */}
                            <View style={style.secaoRoleta}>
                                <View style={style.cabecalhoSecao}>
                                    <Text style={style.tituloSecao}>
                                        Meus Pets
                                    </Text>

                                    {pets.length > 0 && (
                                        <View style={style.contador}>
                                            <Text style={style.textoContador}>
                                                {pets.length}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                <FlatList
                                    data={pets}
                                    horizontal
                                    keyExtractor={(item, index) => String(item.id_pet ?? index)}
                                    renderItem={renderizarPet}
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={style.listaRoleta}
                                    extraData={petSelecionado?.id_pet}
                                    ListFooterComponent={renderizarBotaoAdicionar}
                                />
                            </View>

                            {/* pet selecionado em destaque */}
                            {pets.length === 0 ? (
                                <View style={style.estadoVazio}>
                                    <View style={style.ilustracaoVazia}>
                                        <Ionicons
                                            name="paw"
                                            size={55}
                                            color={cores.laranja}
                                        />
                                    </View>

                                    <Text style={style.textoEstado}>
                                        Você ainda não cadastrou nenhum pet.
                                        Adicione seu primeiro companheiro!
                                    </Text>
                                </View>
                            ) : petSelecionado && (
                                <TouchableOpacity
                                    style={style.cartaoDestaque}
                                    activeOpacity={0.9}
                                    onPress={() => abrirPet(petSelecionado)}
                                >
                                    <View style={style.faixaDecorativa} />

                                    {petSelecionado.foto_perfil ? (
                                        <Image
                                            source={{
                                                uri: petSelecionado.foto_perfil,
                                            }}
                                            style={style.fotoDestaque}
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <View style={style.fotoDestaqueSemFoto}>
                                            <Ionicons
                                                name="paw"
                                                size={54}
                                                color={cores.laranja}
                                            />
                                        </View>
                                    )}

                                    <Text style={style.etiquetaDestaque}>
                                        SEU COMPANHEIRO
                                    </Text>

                                    <Text style={style.nomeDestaque}>
                                        {petSelecionado.nome || "Meu pet"}
                                    </Text>

                                    <View style={style.chipEspecie}>
                                        <Text style={style.especieDestaque}>
                                            {petSelecionado.especie || "Pet"}
                                        </Text>
                                    </View>

                                    <View style={style.botaoVerPerfil}>
                                        <Text style={style.textoVerPerfil}>
                                            Ver meu pet
                                        </Text>

                                        <Ionicons
                                            name="arrow-forward"
                                            size={20}
                                            color={cores.fundo}
                                        />
                                    </View>
                                </TouchableOpacity>

                            )}
                        </>
                    )}

                </ScrollView>

                {/* rodapé */}
                <View style={style.rodape}>
                    <Pressable
                        style={style.botaoVoltar}
                        onPress={() => navigation.goBack()}
                        accessibilityRole="button"
                        accessibilityLabel="Voltar"
                    >
                        <Ionicons
                            name="arrow-back"
                            size={25}
                            color={cores.fundo}
                        />
                    </Pressable>
                </View>
            </View>
        </View >
    )
};