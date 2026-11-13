import React, { useState } from "react";

import { Text, View, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Alert } from "../componentes/AlertaTutus";

import BotaoVoltar from "../componentes/BotaoVoltar";
import Botao from "../componentes/Botao";
import CabecalhoAuth from "../componentes/CabecalhoAuth";
import CampoAuth from "../componentes/CampoAuth";
import { estilosAuth } from "../styles/AuthStyles";

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
      style={estilosAuth.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[estilosAuth.conteudo, { paddingTop: insets.top + 20 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <CabecalhoAuth
          rotulo="RECUPERAR ACESSO"
          titulo="Esqueceu a senha?"
          texto="Sem problemas! Enviamos um código para o seu e-mail."
        />

        <View style={estilosAuth.cartao}>
          <CampoAuth
            icone="mail-outline"
            placeholder="E-mail da sua conta"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
          />
        </View>

        <Botao
          titulo="Enviar código"
          larga
          carregando={carregando}
          onPress={recuperarSenha}
          style={estilosAuth.botao}
        />

        <View style={estilosAuth.linhaLink}>
          <Text style={estilosAuth.textoLink}>Lembrou a senha?</Text>
          <Pressable onPress={() => navigation.navigate("Login")} hitSlop={8}>
            <Text style={estilosAuth.textoLinkDestaque}>Entrar</Text>
          </Pressable>
        </View>
      </ScrollView>

      <BotaoVoltar />
    </KeyboardAvoidingView>
  );
}