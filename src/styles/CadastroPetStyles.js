
import { StyleSheet } from "react-native";

export const style = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFDF8",
        paddingHorizontal: 22,
    },

    conteudo: {
        paddingTop: 65,
        paddingBottom: 40,
    },

    titulo: {
        fontSize: 35,
        fontFamily: "Ruwudu-Bold",
        color: "#332716",
    },

    subtitulo: {
        fontSize: 19,
        fontFamily: "Ruwudu-Regular",
        color: "#75571F",
        marginBottom: 20,
    },

    label: {
        fontSize: 20,
        fontFamily: "Ruwudu-Bold",
        color: "#332716",
        marginBottom: 5,
        marginTop: 12,
    },

    input: {
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#FA9F2A",
        borderRadius: 15,
        minHeight: 55,
        paddingHorizontal: 15,
        fontSize: 16,
        color: "#332716",
    },

    inputGrande: {
        minHeight: 110,
        paddingTop: 15,
    },

    botaoSalvar: {
        backgroundColor: "#332716",
        height: 55,
        borderRadius: 30,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 30,
    },

    textoBotao: {
        color: "#FFFDF8",
        fontSize: 20,
        fontFamily: "Ruwudu-Bold",
    },

    botaoVoltar: {
        alignItems: "center",
        marginTop: 20,
    },

    textoVoltar: {
        fontSize: 18,
        fontFamily: "Ruwudu-Bold",
        color: "#332716",
    },


    // Campo de seleção
    seletor: {
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#FA9F2A",
        borderRadius: 15,
        minHeight: 55,
        paddingHorizontal: 15,
        paddingVertical: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    textoSeletor: {
        fontSize: 16,
        color: "#332716",
        flex: 1,
    },

    seta: {
        fontSize: 25,
        color: "#FA9F2A",
        marginLeft: 8,
    },

    // Escolha do tipo de informação sobre idade
    opcaoModo: {
        borderWidth: 1,
        borderColor: "#FFEAC8",
        borderRadius: 15,
        padding: 15,
        marginBottom: 10,
        backgroundColor: "#FFFFFF",
    },

    opcaoModoSelecionada: {
        backgroundColor: "#FFEAC8",
        borderColor: "#FA9F2A",
    },

    textoOpcaoModo: {
        fontSize: 16,
        color: "#332716",
    },

    textoAjuda: {
        fontSize: 14,
        color: "#75571F",
        marginTop: 10,
        fontStyle: "italic",
    },

    // Janela de seleção
    fundoModal: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "flex-end",
    },

    caixaModal: {
        backgroundColor: "#FFFDF8",
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        padding: 25,
        maxHeight: "75%",
    },

    tituloModal: {
        fontSize: 25,
        fontFamily: "Ruwudu-Bold",
        color: "#332716",
        marginBottom: 15,
    },

    itemModal: {
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#FFEAC8",
    },

    textoItemModal: {
        fontSize: 17,
        color: "#332716",
    },

    fecharModal: {
        backgroundColor: "#332716",
        borderRadius: 30,
        alignItems: "center",
        justifyContent: "center",
        padding: 13,
        marginTop: 20,
    },

    fotoContainer: {
        alignItems: "center",
        marginTop: 10,
        marginBottom: 25,
    },

    fotoBotao: {
        width: 115,
        height: 115,
        borderRadius: 60,
        backgroundColor: "#FFEAC8",
        borderWidth: 2,
        borderColor: "#FA9F2A",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
    },

    fotoPreview: {
        width: "100%",
        height: "100%",
        borderRadius: 60,
    },

    textoAdicionarFoto: {
        fontSize: 19,
        fontFamily: "Ruwudu-Bold",
        color: "#FA9F2A",
        marginTop: 8,
    },

    textoFotoOpcional: {
        fontSize: 14,
        fontFamily: "Ruwudu-Regular",
        color: "#75571F",
    },
});
