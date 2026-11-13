import React, { useState } from "react";
import { Text, View, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Alert } from "../componentes/AlertaTutus";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";

import BotaoVoltar from "../componentes/BotaoVoltar";
import Botao from "../componentes/Botao";
import CabecalhoAuth from "../componentes/CabecalhoAuth";
import CampoAuth from "../componentes/CampoAuth";
import { estilosAuth } from "../styles/AuthStyles";

import { useSQLiteContext } from "expo-sqlite";
import { cadastrarUsuario } from "../database/Database";

export default function CriarConta({ navigation }) {
  const insets = useSafeAreaInsets();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);

  const db = useSQLiteContext();

  async function criarConta() {
    if (!nome.trim()) {
      Alert.alert("Atenção!", "Informe seu nome.");
      return;
    }

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailValido.test(email.trim())) {
      Alert.alert("E-mail inválido", "Informe um e-mail válido.");
      return;
    }

    if (senha.length < 6) {
      Alert.alert(
        "Senha inválida",
        "A senha deve ter pelo menos 6 caracteres."
      );
      return;
    }

    if (senha !== confirmarSenha) {
      Alert.alert(
        "Senhas diferentes",
        "As senhas informadas não coincidem."
      );
      return;
    }

      try {
      await cadastrarUsuario(db, {
        nome,
        email,
        senha
      });

      Alert.alert(
        "Conta criada!",
        "Seu cadastro foi realizado com sucesso!",
        [
          {
            text: "Entrar",
            onPress: () => navigation.navigate("Login")
          }
        ]
      );

    } catch (erro) {
      console.error("Erro ao cadastrar usuário:", erro);

      Alert.alert(
        "Erro no cadastro",
        "Não foi possível criar sua conta. Esse e-mail pode já estar cadastrado."
      );
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
          rotulo="NOVA CONTA"
          titulo="Crie sua conta!"
          texto="Faça parte do Tutus e comece a cuidar do seu companheiro."
        />

        <View style={estilosAuth.cartao}>
          <CampoAuth
            icone="person-outline"
            placeholder="Seu nome"
            value={nome}
            onChangeText={setNome}
          />

          <CampoAuth
            icone="mail-outline"
            placeholder="E-mail"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
          />

          <CampoAuth
            icone="lock-closed-outline"
            placeholder="Senha (mín. 6 caracteres)"
            value={senha}
            onChangeText={setSenha}
            senha
          />

          <CampoAuth
            icone="shield-checkmark-outline"
            placeholder="Confirme a senha"
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
            senha
          />
        </View>

        <Botao
          titulo="Criar conta"
          larga
          onPress={criarConta}
          style={estilosAuth.botao}
        />

        <View style={estilosAuth.linhaLink}>
          <Text style={estilosAuth.textoLink}>Já tem uma conta?</Text>
          <Pressable onPress={() => navigation.navigate("Login")} hitSlop={8}>
            <Text style={estilosAuth.textoLinkDestaque}>Entrar</Text>
          </Pressable>
        </View>
      </ScrollView>

      <BotaoVoltar />
    </KeyboardAvoidingView>
  );
}