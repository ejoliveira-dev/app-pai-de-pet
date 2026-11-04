
import React, { useState } from "react";
import { Text, View, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';

import { Ionicons } from "@expo/vector-icons";

import { useSQLiteContext } from "expo-sqlite";
import { cadastrarUsuario } from "../database/Database";

export default function CriarConta({ navigation }) {
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
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.conteudo}
        keyboardShouldPersistTaps="handled"
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

        <Text style={styles.titulo}>
          Crie sua conta!
        </Text>

        <Text style={styles.subtitulo}>
          Faça parte do Tutus e comece a cuidar
          do seu companheiro!
        </Text>

        <Text style={styles.label}>Seu nome *</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite seu nome"
          value={nome}
          onChangeText={setNome}
        />

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
      <Text style={styles.label}>Senha *</Text>
      <View style={styles.campoSenha}>
        <TextInput
          style={styles.inputSenha}
          placeholder="Crie uma senha"
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
    
      <Text style={styles.label}>Confirmar Senha *</Text>
      <View style={styles.campoSenha}>
          <TextInput
            style={styles.inputSenha}
            placeholder="Digite sua senha novamente"
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
            secureTextEntry={!mostrarConfirmarSenha}
          />

  <TouchableOpacity onPress={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}>
        <Ionicons
          name={mostrarConfirmarSenha ? "eye-off-outline" : "eye-outline"}
          size={23}
          color="#75571F"
        />
      </TouchableOpacity>
       </View>

        <TouchableOpacity
          style={styles.botao}
          onPress={criarConta}
        >
          <Text style={styles.textoBotao}>
            Criar Conta
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("Login")}
          style={styles.link}
        >
          <Text style={styles.textoLink}>
            Já tem uma conta? Entre aqui!
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFDF8",
  },

  conteudo: {
    padding: 25,
    paddingBottom: 50,
  },

  voltar: {
    marginBottom: 30,
  },

  titulo: {
    fontFamily: "Ruwudu-Bold",
    fontSize: 32,
    color: "#332716",
    marginBottom: 5,
  },

  subtitulo: {
    fontFamily: "Ruwudu-Regular",
    fontSize: 17,
    color: "#75571F",
    marginBottom: 30,
  },

  label: {
    fontFamily: "Ruwudu-Bold",
    fontSize: 17,
    color: "#332716",
    marginBottom: 8,
  },

  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FFEAC8",
    borderRadius: 15,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    color: "#332716",
  },

  botao: {
    backgroundColor: "#FA9F2A",
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
    marginTop: 15,
  },

  textoBotao: {
    fontFamily: "Ruwudu-Bold",
    fontSize: 20,
    color: "#332716",
  },

  link: {
    alignItems: "center",
    marginTop: 25,
  },

  textoLink: {
    fontFamily: "Ruwudu-Regular",
    fontSize: 17,
    color: "#75571F",
    textDecorationLine: "underline",
  },

  campoSenha: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#FFFFFF",
  borderWidth: 1,
  borderColor: "#FFEAC8",
  borderRadius: 15,
  paddingHorizontal: 15,
  marginBottom: 20,
},

inputSenha: {
  flex: 1,
  paddingVertical: 15,
  fontSize: 16,
  color: "#332716",
},
});
