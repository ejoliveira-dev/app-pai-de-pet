import React, { useState } from "react";

import { Text, View, ScrollView, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { Alert } from "../componentes/AlertaTutus";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import BotaoVoltar from "../componentes/BotaoVoltar";
import Botao from "../componentes/Botao";
import CabecalhoAuth from "../componentes/CabecalhoAuth";
import { estilosAuth } from "../styles/AuthStyles";
import { cores, fontes } from "../styles/tema";

import { Ionicons } from "@expo/vector-icons";

import { API_URL } from "../config";

export default function VerificarCodigo({ navigation, route }) {
  const insets = useSafeAreaInsets();

  const { email } = route.params;

  const [codigo, setCodigo] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function verificarCodigo() {
    if (codigo.length !== 6) {
      Alert.alert(
        "Código inválido",
        "Digite os 6 números enviados por e-mail."
      );
      return;
    }

    try {
      setCarregando(true);

      const resposta = await fetch(
        `${API_URL}/verificar-codigo`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email,
            codigo
          })
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        Alert.alert("Atenção", dados.mensagem);
        return;
      }

      navigation.navigate("NovaSenha", {
        email: email
      });

    } catch (erro) {
      Alert.alert(
        "Servidor indisponível",
        "Não foi possível verificar o código."
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
          rotulo="VERIFICAÇÃO"
          titulo="Confira seu e-mail"
          texto="Digite o código de 6 números que enviamos para:"
        >
          <Text style={estilosAuth.emailDestaque} numberOfLines={1}>
            {email}
          </Text>
        </CabecalhoAuth>

        {/* 6 caixinhas; o campo de verdade fica invisível por cima delas */}
        <View style={estilosAuth.cartao}>
          <View style={styles.caixas}>
            {[0, 1, 2, 3, 4, 5].map((indice) => (
              <View
                key={indice}
                style={[
                  styles.caixa,
                  codigo[indice] && styles.caixaPreenchida,
                  indice === codigo.length && styles.caixaAtual,
                ]}
              >
                <Text style={styles.digito}>{codigo[indice] || ""}</Text>
              </View>
            ))}

            <TextInput
              style={styles.campoInvisivel}
              value={codigo}
              onChangeText={(texto) =>
                setCodigo(texto.replace(/[^0-9]/g, "").slice(0, 6))
              }
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
              caretHidden
            />
          </View>
        </View>

        <Text style={estilosAuth.dica}>Não chegou? Confira a caixa de spam.</Text>

        <Botao
          titulo="Verificar código"
          larga
          carregando={carregando}
          onPress={verificarCodigo}
          style={estilosAuth.botao}
        />
      </ScrollView>

      <BotaoVoltar />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  caixas: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },

  caixa: {
    flex: 1,
    height: 58,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(51, 39, 22, 0.15)",
    backgroundColor: cores.branco,
    alignItems: "center",
    justifyContent: "center",
  },

  caixaPreenchida: {
    borderColor: cores.laranja,
  },

  caixaAtual: {
    borderColor: cores.marrom,
    borderWidth: 2,
  },

  digito: {
    fontFamily: fontes.negrito,
    fontSize: 26,
    lineHeight: 48,
    color: cores.marrom,
  },

  campoInvisivel: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0,
  },
});