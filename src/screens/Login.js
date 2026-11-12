import React, { useState } from "react";

import { Text, View, Image, TextInput, TouchableOpacity, Pressable, Alert, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';

import { style } from "../../src/styles/LoginStyles";

import BotaoVoltar from "../componentes/BotaoVoltar";

import { Ionicons } from '@expo/vector-icons';
import { FontAwesome } from '@expo/vector-icons';

import logo from "../../assets/images/logo-ofc-png-empty2.png";

import { useSQLiteContext } from "expo-sqlite";

import { validarLogin, obterPerfilTutor, salvarPerfilTutor } from "../database/Database";

export default function Login({ navigation }) {

    const db = useSQLiteContext();

    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [mostrarSenha, setMostrarSenha] = useState(false);

    async function entrar() {
        // pra verificar se o e-mail foi preenchido.
        if (!email.trim()) {
            Alert.alert("Atenção!", "Informe seu e-mail.");
            return;
        }

        // pra verificar o formato do e-mail.
        const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailValido.test(email.trim())) {
            Alert.alert("E-mail inválido", "Digite um e-mail válido.");
            return;
        }

        // pra verifica se a senha foi preenchida.
        if (!senha) {
            Alert.alert("Atenção!", "Informe sua senha.");
            return;
        }

        // exigindo pelo menos 6 caracteres.
        if (senha.length < 6) {
            Alert.alert(
                "Senha inválida",
                "A senha deve conter pelo menos 6 caracteres."
            );
            return;
        }

        try {
            const usuario = await validarLogin(db, email, senha);

            if (!usuario) {
                Alert.alert(
                    "Login inválido",
                    "E-mail ou senha incorretos."
                );
                return;
            }

            // guarda o nome e o e-mail da conta no perfil do tutor
            const emailConta = email.trim().toLowerCase();
            const perfilSalvo = await obterPerfilTutor(db);

            if (perfilSalvo?.email !== emailConta) {
                await salvarPerfilTutor(db, {
                    telefone: '',
                    tema: 'padrao',
                    exibirNoPerfilPublico: false,
                    notificacoes: false,
                    ...perfilSalvo,
                    nome: usuario.nome,
                    email: emailConta,
                });
            }

            navigation.reset({
                index: 0,
                routes: [{ name: "ListaPets" }],
            });

        } catch (erro) {
            console.error("Erro ao entrar:", erro);

            Alert.alert(
                "Erro",
                "Não foi possível realizar o login."
            );
        }
    }

    return (

        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
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
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        <View style={style.campoSenha}>

                            <TextInput
                                placeholder="Senha"
                                style={style.inputSenha}
                                value={senha}
                                onChangeText={setSenha}
                                secureTextEntry={!mostrarSenha}
                            />

                            <TouchableOpacity onPress={() => setMostrarSenha(!mostrarSenha)}>
                                <Ionicons
                                    name={mostrarSenha ? "eye-off-outline" : "eye-outline"}
                                    size={23}
                                    color="#75571F"
                                />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            onPress={() => navigation.navigate("EsqueceuSenha")}
                            style={{
                                alignSelf: "center",
                                marginTop: -10,
                            }}
                        >
                            <Text
                                style={{
                                    color: "#FA9F2A",
                                    fontSize: 16,
                                    fontFamily: "Ruwudu-Bold",
                                    textDecorationLine: "underline",
                                }}
                            >
                                Esqueci minha senha
                            </Text>
                        </TouchableOpacity>

                    </View>

                    <View style={style.boxBottom}>

                        <TouchableOpacity style={style.botao} onPress={entrar}>
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

                            <TouchableOpacity onPress={() => navigation.navigate("CriarConta")}>
                                <Text style={style.linkCriarConta}>
                                    Crie uma conta
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>

            <BotaoVoltar />
        </KeyboardAvoidingView>
    );
}                  
