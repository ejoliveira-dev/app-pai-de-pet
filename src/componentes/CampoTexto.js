import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { cores, fontes, raio } from "../styles/tema";

// Campo padrão do app. Props úteis:

//  label -> texto acima do campo.
//  senha -> true: esconde o texto e mostra o "olhinho".
//  erro -> texto de erro mostrado abaixo (e borda vermelha).
//  inputStyle-> estilo extra só do TextInput.
// Qualquer outra prop (value, onChangeText, keyboardType...) vai direto ao TextInput.

export default function CampoTexto({ label, senha = false, erro, style, inputStyle, ...props }) {
  const [mostrar, setMostrar] = useState(false);

  return (
    <View style={[estilos.grupo, style]}>
      {label ? <Text style={estilos.label}>{label}</Text> : null}

      <View style={[estilos.campo, erro ? estilos.campoErro : null]}>
        <TextInput
          style={[estilos.input, inputStyle]}
          placeholderTextColor="#A89A82"
          secureTextEntry={senha && !mostrar}
          autoCapitalize={senha ? "none" : "sentences"}
          {...props}
        />

        {senha && (
          <TouchableOpacity
            onPress={() => setMostrar(!mostrar)}
            accessibilityLabel={mostrar ? "Ocultar senha" : "Mostrar senha"}
          >
            <Ionicons
              name={mostrar ? "eye-off-outline" : "eye-outline"}
              size={23}
              color={cores.marromClaro}
            />
          </TouchableOpacity>
        )}
      </View>

      {erro ? <Text style={estilos.msgErro}>{erro}</Text> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  grupo: { marginBottom: 20 },
  label: {
    fontFamily: fontes.negrito,
    fontSize: 17,
    color: cores.marrom,
    marginBottom: 8,
  },
  campo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: cores.branco,
    borderWidth: 1,
    borderColor: cores.laranja,
    borderRadius: raio.campo,
    paddingHorizontal: 15,
  },
  campoErro: { borderColor: cores.erro },
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 14,
    fontSize: 16,
    color: cores.marrom,
  },
  msgErro: {
    fontFamily: fontes.regular,
    fontSize: 14,
    color: cores.erro,
    marginTop: 6,
  },
});