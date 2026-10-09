
import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { style } from "./styles";

export default function ListaPets() {
    return (
        <View style={style.container}>
            <Text style={style.titulo}>Meus Pets</Text>

            <TouchableOpacity style={style.petCard}>
                <Image
                    source={require("../../img/meuPet.png")}
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
                <Text style={style.textoBotao}>＋ Adicionar Pet</Text>
            </TouchableOpacity>
        </View>
    );
}