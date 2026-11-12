import React from "react";
import { View, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { cores } from "../styles/tema";

// Foto redonda do pet com borda.

// Se o pet não tem foto, mostra a patinha.

//  tamanho -> diâmetro em pixels.

//  selecionado -> borda laranja grossa.

export default function AvatarPet({ foto, tamanho = 74, selecionado = false, style }) {
  const raio = tamanho / 2;

  return (
    <View
      style={[
        {
          width: tamanho,
          height: tamanho,
          borderRadius: raio,
          padding: 3,
          borderWidth: selecionado ? 3 : 2,
          borderColor: selecionado ? cores.laranja : cores.bordaCreme,
          backgroundColor: selecionado ? cores.laranjaClaro : cores.branco,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      {foto ? (
        <Image
          source={{ uri: foto }}
          style={{ width: "100%", height: "100%", borderRadius: raio }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={{
            flex: 1,
            width: "100%",
            borderRadius: raio,
            backgroundColor: cores.creme,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="paw" size={tamanho * 0.4} color={cores.laranja} />
        </View>
      )}
    </View>
  );
}