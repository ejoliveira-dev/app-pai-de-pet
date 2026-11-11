import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { cores, fontes, raio } from "../styles/tema";

// Botão em pílula (tipo "Entrar" ou "Começar").
// variante: "primario" (marrom), "secundario" (laranja), "contorno" ou "perigo".

// larga: true -> ocupa a largura toda.

const variantes = {
  primario: { botao: { backgroundColor: cores.marrom }, texto: { color: cores.fundo } },
  secundario: { botao: { backgroundColor: cores.laranja }, texto: { color: cores.marrom } },
  contorno: {
    botao: { backgroundColor: "transparent", borderWidth: 1, borderColor: cores.marrom },
    texto: { color: cores.marrom },
  },
  perigo: {
    botao: { backgroundColor: "transparent", borderWidth: 1, borderColor: cores.erro },
    texto: { color: cores.erro },
  },
};

export default function Botao({
  titulo,
  onPress,
  variante = "primario",
  carregando = false,
  desabilitado = false,
  larga = false,
  icone,
  style,
}) {
  const v = variantes[variante] || variantes.primario;
  const bloqueado = carregando || desabilitado;

  return (
    <TouchableOpacity
      style={[
        estilos.base,
        larga && estilos.larga,
        v.botao,
        bloqueado && estilos.bloqueado,
        style,
      ]}
      onPress={onPress}
      disabled={bloqueado}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={titulo}
    >
      {carregando ? (
        <ActivityIndicator color={v.texto.color} />
      ) : (
        <>
          {icone ? <Ionicons name={icone} size={20} color={v.texto.color} /> : null}
          <Text style={[estilos.texto, v.texto]}>{titulo}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const estilos = StyleSheet.create({
  base: {
    height: 50,
    minWidth: 200,
    paddingHorizontal: 30,
    borderRadius: raio.botao,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    alignSelf: "center",
    marginTop: 20,
  },
  larga: { alignSelf: "stretch" },
  texto: { fontFamily: fontes.negrito, fontSize: 20 },
  bloqueado: { opacity: 0.6 },
});