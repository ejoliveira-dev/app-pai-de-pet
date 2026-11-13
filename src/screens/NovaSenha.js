
import React, { useState } from "react";

import { View, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Alert } from "../componentes/AlertaTutus";

import { Ionicons } from "@expo/vector-icons";
import { useSQLiteContext } from "expo-sqlite";
import { atualizarSenha } from "../database/Database";

import BotaoVoltar from "../componentes/BotaoVoltar";
import Botao from "../componentes/Botao";
import CabecalhoAuth from "../componentes/CabecalhoAuth";
import CampoAuth from "../componentes/CampoAuth";
import { estilosAuth } from "../styles/AuthStyles";

export default function NovaSenha({ navigation, route }) {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const { email } = route.params;

  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function salvarNovaSenha() {
    if (!senha || !confirmarSenha) {
      Alert.alert("Atenção", "Preencha os dois campos de senha.");
      return;
    }

    if (senha.length < 6) {
      Alert.alert(
        "Senha muito curta",
        "A senha deve ter pelo menos 6 caracteres."
      );
      return;
    }

    if (senha !== confirmarSenha) {
      Alert.alert(
        "Senhas diferentes",
        "As senhas digitadas não coincidem."
      );
      return;
    }

    try {
      setCarregando(true);

      const atualizado = await atualizarSenha(db, email, senha);

      if (!atualizado) {
        Alert.alert(
          "Erro",
          "Não encontramos uma conta com esse e-mail."
        );
        return;
      }

      Alert.alert(
        "Senha alterada!",
        "Sua senha foi atualizada com sucesso.",
        [
          {
            text: "Ir para o login",
            onPress: () => navigation.reset({
              index: 0,
              routes: [{ name: "Login" }]
            })
          }
        ]
      );

    } catch (erro) {
      Alert.alert(
        "Erro",
        "Não foi possível atualizar sua senha."
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
          icone="lock-closed-outline"
          rotulo="QUASE LÁ"
          titulo="Crie uma nova senha"
          texto="Escolha uma senha com pelo menos 6 caracteres."
        />

        <View style={estilosAuth.cartao}>
          <CampoAuth
            icone="lock-closed-outline"
            placeholder="Nova senha"
            value={senha}
            onChangeText={setSenha}
            senha
          />

          <CampoAuth
            icone="shield-checkmark-outline"
            placeholder="Confirme a nova senha"
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
            senha
          />
        </View>

        <Botao
          titulo="Salvar nova senha"
          larga
          carregando={carregando}
          onPress={salvarNovaSenha}
          style={estilosAuth.botao}
        />
      </ScrollView>

      <BotaoVoltar />
    </KeyboardAvoidingView>
  );
}