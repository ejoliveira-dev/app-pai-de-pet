import React, { useState, useCallback } from "react";
import { View, Text, Image, TouchableOpacity, Pressable, ScrollView, Alert } from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

import { Ionicons } from '@expo/vector-icons';
import { style } from "../../src/styles/ListaPetsStyles";

export default function ListaPets({ navigation }) {

    const [pets, setPets] = useState([]);
    // controla o carregamento dos dados
    const [carregando, setCarregando] = useState(true);

    // busca os pets salvos
    useFocusEffect(
        useCallback(() => {

            let ativo = true;
            async function carregarPets() {
                if (ativo) setCarregando(true);

                try {
                    const dadosSalvos = await AsyncStorage.getItem("@tutus:pets");

                    const lista = dadosSalvos
                        ? JSON.parse(dadosSalvos)
                        : [];

                    if (ativo) {
                        setPets(Array.isArray(lista) ? lista : []);
                    }

                } catch (erro) {
                    Alert.alert(
                        "Erro",
                        "Não foi possível carregar os pets cadastrados."
                    );

                } finally {
                    if (ativo) setCarregando(false);
                }
            }

            carregarPets();

            return () => {
                ativo = false;
            };

        }, [])
    );

    return (
        <View style={style.container}>

            <ScrollView style={{ flex: 1 }} conteudoContainerStyle={style.conteudo} showsVerticalScrollIndicator={false} >

                <Text style={style.titulo}>
                    De quem vamos cuidar hoje?
                </Text>

                {carregando ? (
                    <Text style={style.petTipo}>
                        Carregando pets...
                    </Text>

                ) : pets.length === 0 ? (

                    <Text style={style.petTipo}>
                        Você ainda não cadastrou nenhum pet. Que tal adicionar seu primeiro companheiro?
                    </Text>

                ) : (

                    pets.map((pet) => (
                        <TouchableOpacity
                            key={pet.id_pet}
                            style={style.petCard}
                            onPress={() => navigation.navigate("MainTabs", {
                                petSelecionado: pet
                            })}
                        >

                            {pet.foto_perfil ? (

                                <Image
                                    source={{ uri: pet.foto_perfil }}
                                    style={style.petImagem}
                                    resizeMode="cover"
                                />

                            ) : (

                                <View
                                    style={[
                                        style.petImagem,
                                        {
                                            justifyContent: "center",
                                            alignItems: "center"
                                        }
                                    ]}
                                >
                                    <Ionicons
                                        name="paw"
                                        size={32}
                                        color="#FA9F2A"
                                    />
                                </View>

                            )}

                            <View style={style.petInfo}>
                                <Text style={style.petNome}>
                                    {pet.nome}
                                </Text>

                                <Text style={style.petTipo}>
                                    {pet.especie}
                                </Text>
                            </View>

                            <Text style={style.seta}>›</Text>

                        </TouchableOpacity>
                    ))
                )}

                <TouchableOpacity style={style.botao} onPress={() => navigation.navigate("CadastroPets")}>
                    <Text style={style.textoBotao}>
                        ＋ Adicionar Pet
                    </Text>
                </TouchableOpacity>

            </ScrollView>

            <View style={style.rodape}>
                <Pressable
                    style={style.botaoVoltar}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons
                        name="arrow-back"
                        size={28}
                        color="#FFFDF8"
                    />
                </Pressable>
            </View>

        </View>
    );
}