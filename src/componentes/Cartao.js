import React from "react";
import { View, StyleSheet } from "react-native";
import { cores, raio, espaco, sombra } from "../styles/tema";

// Cartão branco padrão.

export default function Cartao({ children, style }) {
  return <View style={[estilos.cartao, style]}>{children}</View>;
}

const estilos = StyleSheet.create({
  cartao: {
    backgroundColor: cores.branco,
    borderRadius: raio.cartao,
    borderWidth: 1.5,
    borderColor: cores.bordaCartao,
    padding: espaco.md,
    ...sombra,
  },
});