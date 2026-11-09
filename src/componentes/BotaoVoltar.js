import React, { useEffect, useState } from "react";
import { Pressable, Keyboard, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { style } from "../styles/LoginStyles";

export default function BotaoVoltar() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [tecladoAberto, setTecladoAberto] = useState(false);

  useEffect(() => {
    const mostrar = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setTecladoAberto(true)
    );
    const esconder = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setTecladoAberto(false)
    );
    return () => {
      mostrar.remove();
      esconder.remove();
    };
  }, []);

  if (!navigation.canGoBack() || tecladoAberto) return null;

  return (
    <Pressable
      onPress={() => navigation.goBack()}
      style={[style.botaoVoltar, { position: "absolute", left: 25, bottom: insets.bottom + 20 }]}
    >
      <Ionicons name="arrow-back" size={26} color="#FFFDF8" />
    </Pressable>
  );
}