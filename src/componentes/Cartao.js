import React from "react";
import { View, StyleSheet } from "react-native";
import { raio, espaco, sombra } from "../styles/tema";
import { useTema } from "../styles/TemaContext";

// Cartão padrão.

export default function Cartao({ children, style }) {
  const { cores } = useTema();
  const estilos = criarEstilos(cores);

  return <View style={[estilos.cartao, style]}>{children}</View>;
}

const criarEstilos = (cores) => StyleSheet.create({
  cartao: {
    backgroundColor: cores.branco,
    borderRadius: raio.cartao,
    borderWidth: 1.5,
    borderColor: cores.bordaCartao,
    padding: espaco.md,
    ...sombra,
    shadowColor: cores.marrom,
  },
});