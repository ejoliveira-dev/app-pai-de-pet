import React, { useState } from "react";

import { Text, View, ScrollView, TextInput,TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import BotaoVoltar from "../componentes/BotaoVoltar";

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
            name="mail-open-outline"
            size={75}
            color="#FA9F2A"
          />

          <Text style={styles.titulo}>
            Verifique seu e-mail!
          </Text>

          <Text style={styles.subtitulo}>
            Enviamos um código de 6 dígitos para:
          </Text>

          <Text style={styles.email}>
            {email}
          </Text>

          <Text style={styles.label}>
            Código de verificação *
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Digite o código"
            value={codigo}
            onChangeText={(texto) =>
              setCodigo(texto.replace(/[^0-9]/g, "").slice(0, 6))
            }
            keyboardType="number-pad"
            maxLength={6}
          />

          <TouchableOpacity
            style={styles.botao}
            onPress={verificarCodigo}
            disabled={carregando}
          >
            <Text style={styles.textoBotao}>
              {carregando ? "Verificando..." : "Verificar Código"}
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
  },

  email: {
    fontFamily: "Ruwudu-Bold",
    fontSize: 17,
    color: "#332716",
    marginTop: 5,
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
    fontSize: 20,
    color: "#332716",
    letterSpacing: 5,
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
