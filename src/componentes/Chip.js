import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { cores, fontes, raio } from "../styles/tema";

// Etiqueta creme.

export default function Chip({ texto, icone, style, pequeno = false }) {
  return (
    <View style={[estilos.chip, pequeno && estilos.chipPequeno, style]}>
      {icone ? (
        <Ionicons name={icone} size={pequeno ? 13 : 15} color={cores.marromClaro} />
      ) : null}
      <Text style={[estilos.texto, pequeno && estilos.textoPequeno]}>{texto}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    backgroundColor: cores.creme,
    borderWidth: 1,
    borderColor: cores.bordaCreme,
    borderRadius: raio.chip,
    paddingHorizontal: 16,
    paddingVertical: 3,
  },

  texto: {
    fontFamily: fontes.regular,
    fontSize: 18,
    color: cores.marromClaro,
    top: 3,
  },

  chipPequeno: {
    gap: 4,
    paddingHorizontal: 10,
  },

  textoPequeno: { 
    fontSize: 14, 
    lineHeight: 20, 
  },
});