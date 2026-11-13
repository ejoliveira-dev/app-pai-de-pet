import { StyleSheet } from "react-native";
import { cores, fontes, sombra } from "./tema";

export const estilosAuth = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: cores.fundo,
    },

    conteudo: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingBottom: 120,
    },

    cartao: {
        backgroundColor: cores.branco,
        borderRadius: 25,
        padding: 16,
        gap: 12,
        marginTop: 18,
        ...sombra,
    },

    botao: {
        marginTop: 22,
    },

    linhaLink: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        gap: 5,
        marginTop: 18,
    },

    textoLink: {
        fontFamily: fontes.regular,
        fontSize: 16,
        lineHeight: 30,
        color: cores.marromClaro,
    },

    textoLinkDestaque: {
        fontFamily: fontes.negrito,
        fontSize: 16,
        lineHeight: 30,
        color: cores.laranja,
    },

    emailDestaque: {
        alignSelf: "flex-start",
        marginTop: 12,
        backgroundColor: "rgba(250, 159, 42, 0.22)",
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 4,
        fontFamily: fontes.negrito,
        fontSize: 15,
        lineHeight: 26,
        color: cores.laranjaClaro,
    },

    // dica pequena embaixo do cartão
    dica: {
        fontFamily: fontes.regular,
        fontSize: 14,
        lineHeight: 20,
        color: cores.marromClaro,
        textAlign: "center",
        marginTop: 12,
    },
});