import React from "react";
import { View, StyleSheet } from "react-native";
import IconesEspecies from "./IconesEspecies";

export default function DecoracaoPerfil({ especie }) {

    const ehTartaruga = especie?.toLowerCase().trim() === "tartaruga";

    const posicoes = ehTartaruga
        ? [
            { left: 20, bottom: 35, tamanho: 55, giro: "-25deg" },
            { right: 20, top: 30, tamanho: 60, giro: "25deg" },
        ]
        : [
            { left: 18, top: 20, tamanho: 38, giro: "-30deg" },
            { left: 60, bottom: 35, tamanho: 32, giro: "20deg" },
            { right: 45, top: 15, tamanho: 34, giro: "25deg" },
            { right: 12, bottom: 25, tamanho: 42, giro: "-22deg" },
        ];

    return (
        <View style={styles.container} pointerEvents="none">

            <View style={styles.circuloSuperior} />
            <View style={styles.circuloInferior} />

            {posicoes.map(({ tamanho, giro, ...posicao }, index) => (
                <View
                    key={index}
                    style={[
                        styles.icone,
                        posicao,
                        { transform: [{ rotate: giro }] }
                    ]}
                >
                    <IconesEspecies
                        especie={especie}
                        tamanho={tamanho}
                    />
                </View>
            ))}

        </View>
    );
}

const styles = StyleSheet.create({

    container: {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        zIndex: 1,
    },    

    circuloSuperior: {
        position: "absolute",
        width: 180,
        height: 180,
        borderRadius: 90,
        top: -90,
        right: -80,
        backgroundColor: "rgba(250, 159, 42, 0.12)",
    },

    circuloInferior: {
        position: "absolute",
        width: 160,
        height: 160,
        borderRadius: 80,
        bottom: -80,
        left: -80,
        backgroundColor: "rgba(250, 159, 42, 0.08)",
    },

    icone: {
        position: "absolute",
        opacity: 0.24,
    },
});