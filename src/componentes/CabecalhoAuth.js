import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { cores, fontes } from "../styles/tema";

export default function CabecalhoAuth({ icone, rotulo, titulo, texto, children }) {
    return (
        <View style={estilos.heroi}>
            <View style={estilos.anel} pointerEvents="none" />

            {!!icone && (
                <View style={estilos.bola}>
                    <Ionicons name={icone} size={28} color={cores.marrom} />
                </View>
            )}

            <Text style={[estilos.rotulo, !icone && { marginTop: 0 }]}>{rotulo}</Text>
            <Text style={estilos.titulo}>{titulo}</Text>

            {!!texto && <Text style={estilos.texto}>{texto}</Text>}

            {children}
        </View>
    );
}

const estilos = StyleSheet.create({
    heroi: {
        backgroundColor: cores.marrom,
        borderRadius: 30,
        padding: 24,
        overflow: "hidden",
    },

    anel: {
        position: "absolute",
        top: -80,
        right: -70,
        width: 230,
        height: 230,
        borderRadius: 115,
        backgroundColor: "rgba(250, 159, 42, 0.18)",
    },

    bola: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: cores.laranja,
        alignItems: "center",
        justifyContent: "center",
    },

    rotulo: {
        fontFamily: fontes.negrito,
        fontSize: 13,
        lineHeight: 24,
        letterSpacing: 2,
        color: cores.terracota,
        marginTop: 18,
    },

    titulo: {
        fontFamily: fontes.negrito,
        fontSize: 30,
        lineHeight: 40,
        color: cores.laranjaClaro,
    },

    texto: {
        fontFamily: fontes.regular,
        fontSize: 16,
        lineHeight: 22,
        color: "rgba(255, 234, 200, 0.75)",
        marginTop: 4,
    },
});