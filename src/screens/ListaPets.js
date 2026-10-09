import React from "react";

import { View, Text, Image, TouchableOpacity, Pressable } from "react-native";

import { Ionicons } from '@expo/vector-icons';

import { style } from "../../src/styles/ListaPetsStyles";

export default function ListaPets({navigation}) {
    return (
        <View style={style.container}>

            <View style={style.conteudo}>

                <Text style={style.titulo}>
                    De quem vamos cuidar hoje?
                </Text>

                <TouchableOpacity style={style.petCard}>
                    <Image
                        source={require("../../assets/images/pet1.jpg")}
                        style={style.petImagem}
                        resizeMode="cover"
                    />

                    <View style={style.petInfo}>
                        <Text style={style.petNome}>Estevão</Text>
                        <Text style={style.petTipo}>Hamster</Text>
                    </View>

                    <Text style={style.seta}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity style={style.petCard}>
                    <Image
                        source={require("../../assets/images/pet2.png")}
                        style={style.petImagem}
                        resizeMode="cover"
                    />

                    <View style={style.petInfo}>
                        <Text style={style.petNome}>Jully</Text>
                        <Text style={style.petTipo}>Gato</Text>
                    </View>

                    <Text style={style.seta}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity style={style.botao}>
                    <Text style={style.textoBotao}>
                        ＋ Adicionar Pet
                    </Text>
                </TouchableOpacity>

            </View>

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