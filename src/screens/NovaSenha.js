
import React, { useState } from "react";

import { Text, View, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useSQLiteContext } from "expo-sqlite";
import { atualizarSenha } from "../database/Database";

export default function NovaSenha({ navigation, route }) {
  const db = useSQLiteContext();
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
  style={styles.container}
  behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
<ScrollView
  contentContainerStyle={{ flexGrow: 1 }}
  keyboardShouldPersistTaps="handled"
  showsVerticalScrollIndicator={false}
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
       Crie uma nova senha
         </Text>

     <Text style={styles.subtitulo}>
       Escolha uma nova senha para acessar sua conta com o tutus!
         </Text>

      <Text style={styles.label}>Nova senha *</Text>

     <View style={styles.campoSenha}>

  <TextInput
    style={[styles.input, styles.inputSenha]}
    placeholder="Digite sua nova senha"
    value={senha}
    onChangeText={setSenha}
    secureTextEntry={!mostrarSenha}
    autoCapitalize="none"
/>

   <TouchableOpacity
     style={styles.olho}
     onPress={() => setMostrarSenha(!mostrarSenha)}
       >
   <Ionicons
     name={mostrarSenha ? "eye-off" : "eye"}
     size={22}
     color="#75571F"
       />
         </TouchableOpacity>
</View>

    <Text style={styles.label}>Confirmar senha *</Text>

    <View style={styles.campoSenha}>

        <TextInput
          style={[styles.input, styles.inputSenha]}
          placeholder="Digite novamente sua senha"
          value={confirmarSenha}
          onChangeText={setConfirmarSenha}
          secureTextEntry={!mostrarConfirmarSenha}
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={styles.olho}
          onPress={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
        >
          <Ionicons
            name={mostrarConfirmarSenha ? "eye-off" : "eye"}
            size={22}
            color="#75571F"
          />
        </TouchableOpacity>
             </View>

       <TouchableOpacity
          style={styles.botao}
          onPress={salvarNovaSenha}
          disabled={carregando}
        >
       <Text style={styles.textoBotao}>
          {carregando ? "Salvando..." : "Salvar nova senha"}
            </Text>
</TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingBottom: 40,
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
    marginBottom: 30,
  },

  label: {
    fontFamily: "Ruwudu-Bold",
    fontSize: 18,
    color: "#332716",
    marginBottom: 10,
    marginTop: 15,
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

  campoSenha: {
  position: "relative",
  justifyContent: "center",
},

inputSenha: {
  paddingRight: 50,
},

olho: {
  position: "absolute",
  right: 15,
  top: 0,
  bottom: 0,
  justifyContent: "center",
  opacity: 0.5,
},
});
