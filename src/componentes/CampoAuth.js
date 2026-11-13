import React, { useState } from "react";
import { View, TextInput, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { cores, fontes } from "../styles/tema";

export default function CampoAuth({ icone, senha = false, style, ...props }) {
    const [focado, setFocado] = useState(false);
    const [mostrar, setMostrar] = useState(false);

    return (
        <View style={[estilos.campo, focado && estilos.campoFocado, style]}>
            <Ionicons
                name={icone}
                size={20}
                color={focado ? cores.marrom : cores.laranja}
            />

            <TextInput
                style={estilos.input}
                placeholderTextColor="#A89A82"
                secureTextEntry={senha && !mostrar}
                autoCapitalize={senha ? "none" : props.autoCapitalize}
                onFocus={() => setFocado(true)}
                onBlur={() => setFocado(false)}
                {...props}
            />

            {senha && (
                <Pressable
                    onPress={() => setMostrar((atual) => !atual)}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel={mostrar ? "Ocultar senha" : "Mostrar senha"}
                >
                    <Ionicons
                        name={mostrar ? "eye-off-outline" : "eye-outline"}
                        size={22}
                        color={cores.marromClaro}
                    />
                </Pressable>
            )}
        </View>
    );
}

const estilos = StyleSheet.create({
    campo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        height: 56,
        paddingHorizontal: 16,
        backgroundColor: cores.branco,
        borderWidth: 1.5,
        borderColor: cores.laranja,
        borderRadius: 18,
    },

    campoFocado: {
        borderColor: cores.marrom,
    },

    input: {
        flex: 1,
        minWidth: 0,
        height: "100%",
        fontFamily: fontes.regular,
        fontSize: 17,
        color: cores.marrom,
        paddingVertical: 0,
        includeFontPadding: false,
        textAlignVertical: "center",
        paddingTop: 12,
    },
});