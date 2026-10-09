import React from "react";

import { Text, View, Image, TextInput, TouchableOpacity, Pressable } from 'react-native';

import { style } from "../../src/styles/LoginStyles";

import { Ionicons } from '@expo/vector-icons';
import { FontAwesome } from '@expo/vector-icons';

import logo from "../../assets/images/logo-ofc-png-empty2.png";


export default function Login({ navigation }) {
    return (
        <View style={style.container}>

            <View style={style.boxTop}>
                <Image
                    source={logo}
                    style={style.logo}
                    resizeMode="contain"
                />
            </View>

            <View style={style.boxTitulo}>

                <Text style={style.titulo}>
                    Bem-vindo de volta!
                </Text>
                <Text style={style.subtitulo}>
                    Entre para iniciar os cuidados com seu pet.
                </Text>
            </View>

            <View style={style.boxMid}>
                <TextInput
                    placeholder="Endereço de e-mail"
                    style={style.input}
                />

                <TextInput
                    secureTextEntry={true}
                    placeholder="Senha"
                    style={style.input}
                />
            </View>

            <View style={style.boxBottom}>

                <TouchableOpacity style={style.botao} onPress={() => navigation.navigate('ListaPets')}>
                    <Text style={style.textoBotao}>
                        Entrar
                    </Text>
                </TouchableOpacity>

                <View style={style.socialBotoes}>

                    <TouchableOpacity
                        style={style.socialBotao}
                        accessibilityLabel="Entrar com Facebook"
                    >
                        <FontAwesome
                            name="facebook"
                            size={26}
                            color="#332716"
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={style.socialBotao}
                        accessibilityLabel="Entrar com Apple"
                    >
                        <FontAwesome
                            name="apple"
                            size={28}
                            color="#332716"
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={style.socialBotao}
                        accessibilityLabel="Entrar com Google"
                    >
                        <FontAwesome
                            name="google"
                            size={26}
                            color="#332716"
                        />
                    </TouchableOpacity>

                </View>

                <View style={style.contaContainer}>
                    <Text style={style.textoConta}>
                        Primeira vez por aqui?
                    </Text>
                    <Text style={style.linkCriarConta}>
                        Crie uma conta
                    </Text>
                </View>
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