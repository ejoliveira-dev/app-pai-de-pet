import React, { useState } from "react";
import { Text, View, TextInput, TouchableOpacity,  StyleSheet, Alert,KeyboardAvoidingView, Platform } from 'react-native';

import { Ionicons } from "@expo/vector-icons";

export default function EsqueciSenha({ navigation }) {
  const [email, setEmail] = useState("");

  function recuperarSenha() {
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailValido.test(email.trim())) {
      Alert.alert(
        "E-mail inválido",
        "Informe um endereço de e-mail válido."
      );
      return;
    }

    Alert.alert(
      "Demonstração",
      "O e-mail foi validado, mas a recuperação de senha ainda não está conectada a um serviço. Nenhum e-mail foi enviado."
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.voltar}
      >
        <Ionicons
          name="arrow-back"
          size={26}
          color="#332716"
        />
      </TouchableOpacity>

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
        >
          <Text style={styles.textoBotao}>
            Recuperar Senha
          </Text>
        </TouchableOpacity>
      </View>
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
    paddingBottom: 70,
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
