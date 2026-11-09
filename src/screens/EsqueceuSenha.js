import React, { useState } from "react";

import { Text, View, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

import BotaoVoltar from "../componentes/BotaoVoltar";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";

import { API_URL } from "../config";

export default function EsqueciSenha({ navigation }) {
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function recuperarSenha() {
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailValido.test(email.trim())) {
      Alert.alert(
        "E-mail inválido",
        "Informe um endereço de e-mail válido."
      );
      return;
    }

    try {
      setCarregando(true);

      const resposta = await fetch(
        `${API_URL}/solicitar-codigo`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase()
          })
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        Alert.alert("Atenção", dados.mensagem);
        return;
      }

      Alert.alert(
        "Código enviado!",
        "Confira sua caixa de entrada para continuar."
      );

      navigation.navigate("VerificarCodigo", {
        email: email.trim().toLowerCase()
      });

    } catch (erro) {
      Alert.alert(
        "Servidor indisponível",
        "Não foi possível conectar ao servidor."
      );
    } finally {
      setCarregando(false);
    }
  }


  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.conteudo}>
          <Ionicons
            name="lock-closed-outline"
            size={75}
            color="#FA9F2A"
          />

          <Text style={styles.titulo}>
            Esqueceu sua senha?
          </Text>

          <Text style={styles.subtitulo}>
            Informe seu e-mail para solicitar
            a recuperação da sua conta.
          </Text>

          <Text style={styles.label}>E-mail *</Text>

          <TextInput
            style={styles.input}
            placeholder="Digite seu e-mail"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
          />

          <TouchableOpacity
            style={styles.botao}
            onPress={recuperarSenha}
            disabled={carregando}
          >
            <Text style={styles.textoBotao}>
              {carregando ? "Enviando..." : "Recuperar Senha"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <BotaoVoltar />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFDF8",
    padding: 25,
  },

  voltar: {
    marginTop: 15,
  },

  conteudo: {
    flex: 1,
    justifyContent: "center",
    paddingBottom: 110,
  },

  titulo: {
    fontFamily: "Ruwudu-Bold",
    fontSize: 30,
    color: "#332716",
    marginTop: 25,
  },

  subtitulo: {
    fontFamily: "Ruwudu-Regular",
    fontSize: 17,
    color: "#75571F",
    marginTop: 10,
    marginBottom: 35,
  },

  label: {
    fontFamily: "Ruwudu-Bold",
    fontSize: 18,
    color: "#332716",
    marginBottom: 10,
  },

  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FFEAC8",
    borderRadius: 15,
    padding: 15,
    fontSize: 16,
    color: "#332716",
  },

  botao: {
    backgroundColor: "#FA9F2A",
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
    marginTop: 25,
  },

  textoBotao: {
    fontFamily: "Ruwudu-Bold",
    fontSize: 20,
    color: "#332716",
  },
});
