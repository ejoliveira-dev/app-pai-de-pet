import React, { useState, useCallback, useRef } from "react";
import { View, Text, Image, TouchableOpacity, Pressable, ScrollView, FlatList, useWindowDimensions } from "react-native";
import { Alert } from "../componentes/AlertaTutus";

import { useSQLiteContext } from "expo-sqlite";
import { listarPets, definirPetSelecionadoId, obterPerfilTutor } from "../database/Database";
import { useFocusEffect } from "@react-navigation/native";

import { Ionicons } from '@expo/vector-icons';

import { criarStyle } from "../styles/ListaPetsStyles";
import { useTema } from "../styles/TemaContext";

import logo from "../../assets/images/logo-ofc-png-empty2.png";

export default function ListaPets({ navigation }) {
    const db = useSQLiteContext();

    const { cores } = useTema();
    const style = criarStyle(cores);

    const { width } = useWindowDimensions();
    const larguraCartao = width - 40;
    const carrosselRef = useRef(null);

    const [pets, setPets] = useState([]);
    const [petSelecionado, setPetSelecionado] = useState(null);
    const [nomeTutor, setNomeTutor] = useState("");

    const [carregando, setCarregando] = useState(true);
    // controla o carregamento dos dados

    // busca os pets salvos no SQLite sempre que a tela recebe foco.
    useFocusEffect(
        useCallback(() => {
            let ativo = true;

            async function carregarPets() {
                setCarregando(true);

                try {
                    const [lista, perfilTutor] = await Promise.all([
                        listarPets(db),
                        obterPerfilTutor(db)
                    ]);

                    if (ativo) {
                        setNomeTutor(String(perfilTutor?.nome || "").trim().split(/\s+/)[0]);
                        const listaValida = Array.isArray(lista) ? lista : [];

                        setPets(listaValida);

                        setPetSelecionado((atual) => {
                            if (listaValida.length === 0) {
                                return null;
                            }

                            // Mantém a seleção atual, se o pet ainda existir.
                            const petAtual = listaValida.find(
                                (pet) => pet.id_pet === atual?.id_pet
                            );

                            return petAtual || listaValida[0];
                        });
                    }
                } catch (erro) {
                    console.error("Erro ao carregar pets:", erro);

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
        }, [db])
    );


    // abre a área principal com o pet escolhido.
    async function abrirPet(pet) {
        try {
            await definirPetSelecionadoId(db, pet.id_pet);
        } catch (erro) {
            console.error("Erro ao salvar pet selecionado:", erro);
        }

        navigation.reset({
            index: 0,
            routes: [
                {
                    name: "MainTabs",
                    params: {
                        screen: "Inicio",
                        params: { petSelecionado: pet },
                    },
                },
            ],
        });
    }

    // abre o formulário de cadastro.
    function adicionarPet() {
        navigation.navigate("CadastroPets");
    }

    const indiceAtual = Math.max(0, pets.findIndex(pet => pet.id_pet === petSelecionado?.id_pet));

        function irParaPet(indice) {
            if (indice < 0 || indice >= pets.length) return;

            carrosselRef.current?.scrollToIndex({
                index: indice,
                animated: true
            });

            setPetSelecionado(pets[indice]);
        }

    function renderizarCartao({ item }) {
        return (
            <View style={{ width: larguraCartao }}>
                <TouchableOpacity
                    style={style.cartaoDestaque}
                    activeOpacity={0.9}
                    onPress={() => abrirPet(item)}
                >
                    <View style={style.faixaDecorativa} />

                    {pets.length > 1 && (
                        <View style={style.setasCarrossel}>
                            <Pressable
                                style={[style.setaCarrossel, indiceAtual === 0 && { opacity: 0.3 }]}
                                onPress={() => irParaPet(indiceAtual - 1)}
                                disabled={indiceAtual === 0}
                                accessibilityLabel="Pet anterior"
                            >
                                <Ionicons name="chevron-back" size={24} color={cores.marrom} />
                            </Pressable>

                            <Pressable
                                style={[style.setaCarrossel, indiceAtual === pets.length - 1 && { opacity: 0.3 }]}
                                onPress={() => irParaPet(indiceAtual + 1)}
                                disabled={indiceAtual === pets.length - 1}
                                accessibilityLabel="Próximo pet"
                            >
                                <Ionicons name="chevron-forward" size={24} color={cores.marrom} />
                            </Pressable>
                        </View>
                    )}

                    {item.foto_perfil ? (
                        <Image
                            source={{ uri: item.foto_perfil }}
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

                    <Text style={style.nomeDestaque}>
                        {item.nome || "Meu pet"}
                    </Text>

                    <View style={style.chipEspecie}>
                        <Text style={style.especieDestaque}>
                            {item.especie || "Pet"}
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
            </View>
        );
    }


    return (
        <View style={style.container}>
            <View style={style.topoCirculo} />

            <View style={style.topoLaranja}>
                <Text style={style.saudacao}>
                    Olá, {nomeTutor || "Tutor"}!
                </Text>
            </View>

            <View style={style.painelBranco}>
                <ScrollView
                    style={style.scroll}
                    contentContainerStyle={style.conteudo}
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={false}
                >

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
                                        Seus companheiros
                                    </Text>

                                    {pets.length > 0 && (
                                        <View style={style.contador}>
                                            <Text style={style.textoContador}>
                                                {indiceAtual + 1} de {pets.length}
                                            </Text>
                                        </View>
                                    )}
                                </View>
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
                            ) : (
                                <FlatList
                                    ref={carrosselRef}
                                    data={pets}
                                    extraData={indiceAtual}
                                    horizontal
                                    pagingEnabled
                                    style={{ flexGrow: 0 }}
                                    showsHorizontalScrollIndicator={false}
                                    keyExtractor={(item) => String(item.id_pet)}
                                    renderItem={renderizarCartao}
                                    initialNumToRender={1}
                                    maxToRenderPerBatch={2}
                                    windowSize={3}
                                    getItemLayout={(_, index) => ({
                                        length: larguraCartao,
                                        offset: larguraCartao * index,
                                        index
                                    })}
                                    initialScrollIndex={Math.max(
                                        0,
                                        pets.findIndex(pet => pet.id_pet === petSelecionado?.id_pet)
                                    )}
                                    onMomentumScrollEnd={(event) => {
                                        const indice = Math.round(
                                            event.nativeEvent.contentOffset.x / larguraCartao
                                        );

                                        if (pets[indice]) {
                                            setPetSelecionado(pets[indice]);
                                        }
                                    }}
                                />
                            )}

                              {pets.length > 1 && (
                                <View style={style.indicadoresCarrossel}>
                                    {pets.map((pet, indice) => (
                                        <Pressable
                                            key={pet.id_pet}
                                            onPress={() => irParaPet(indice)}
                                            hitSlop={8}
                                            accessibilityLabel={`Selecionar ${pet.nome}`}
                                            accessibilityState={{ selected: indice === indiceAtual }}
                                            style={[
                                                style.bolinhaCarrossel,
                                                indice === indiceAtual && style.bolinhaAtiva
                                            ]}
                                        />
                                    ))}
                                </View>
                            )}  

                            <TouchableOpacity
                                style={style.adicionarContainer}
                                onPress={adicionarPet}
                                activeOpacity={0.75}
                                accessibilityRole="button"
                                accessibilityLabel="Adicionar companheiro"
                            >
                                <View style={style.botaoCircular}>
                                    <Ionicons
                                        name="add"
                                        size={30}
                                        color={cores.marrom}
                                    />
                                </View>

                                <View style={style.textosAdicionar}>
                                    <Text style={style.textoAdicionar}>
                                        Adicionar companheiro
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </>
                    )}

                </ScrollView>

                {/* rodapé */}
                {navigation.canGoBack() && (
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
                )}
            </View>
        </View>
    )
};