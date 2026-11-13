import { StyleSheet } from "react-native";
 
const cores = {
    fundo: "#FFFDF8",
    branco: "#FFFFFF",
    laranja: "#FA9F2A",
    laranjaClaro: "#FFEAC8",
    creme: "#FFF1DC",
    bordaCreme: "#F2DFC4",
    marrom: "#332716",
    marromMedio: "#75571F",
    erro: "#C0392B",
    erroClaro: "#FDECEA",
};
 
const campo = {
    minHeight: 56,
    backgroundColor: cores.branco,
    borderWidth: 1.5,
    borderColor: cores.bordaCreme,
    borderRadius: 28,
    paddingHorizontal: 22,
    justifyContent: "center",
};
 
const textoCampo = {
    fontSize: 19,
    fontFamily: "Ruwudu-Regular",
    color: cores.marrom,
};
 
const campoSelecionado = {
    backgroundColor: cores.laranjaClaro,
    borderColor: cores.laranja,
};
 
export const style = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: cores.laranja,
    },
 
    topoLaranja: {
        paddingTop: 58,
        paddingBottom: 38,
        paddingHorizontal: 30,
        overflow: "hidden",
    },
 
    topoCirculo: {
        position: "absolute",
        top: -40,
        right: -40,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: cores.laranjaClaro,
        opacity: 0.3,
    },
 
    titulo: {
        fontSize: 34,
        lineHeight: 40,
        fontFamily: "Ruwudu-Bold",
        color: cores.marrom,
    },
 
    subtitulo: {
        fontSize: 20,
        lineHeight: 28,
        fontFamily: "Ruwudu-Regular",
        color: cores.marrom,
        marginTop: 4,
    },
 
    painelBranco: {
        flex: 1,
        backgroundColor: cores.fundo,
        borderTopLeftRadius: 36,
        borderTopRightRadius: 36,
        overflow: "hidden",
    },
 
    conteudo: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 30,
        paddingBottom: 20,
    },
 
    fotoContainer: {
        alignItems: "center",
        marginBottom: 8,
    },
 
    fotoBotao: {
        width: 128,
        height: 128,
        borderRadius: 64,
        backgroundColor: cores.creme,
        borderWidth: 2.5,
        borderStyle: "dashed",
        borderColor: cores.laranja,
        alignItems: "center",
        justifyContent: "center",
    },
 
    fotoPreview: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
 
    fotoBadge: {
        position: "absolute",
        right: 2,
        bottom: 4,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: cores.laranja,
        borderWidth: 3,
        borderColor: cores.fundo,
        alignItems: "center",
        justifyContent: "center",
    },
 
    textoAdicionarFoto: {
        fontSize: 20,
        fontFamily: "Ruwudu-Bold",
        color: cores.laranja,
        marginTop: 12,
    },
 
    secao: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 28,
        marginBottom: 2,
    },
 
    barraSecao: {
        width: 6,
        height: 26,
        borderRadius: 3,
        backgroundColor: cores.laranja,
        marginRight: 10,
    },
 
    tituloSecao: {
        fontSize: 26,
        fontFamily: "Ruwudu-Bold",
        color: cores.marrom,
    },
 
    label: {
        fontSize: 19,
        fontFamily: "Ruwudu-Bold",
        color: cores.marromMedio,
        marginTop: 16,
        marginBottom: 7,
        marginLeft: 8,
    },
 
    input: {
        ...campo,
        ...textoCampo,
    },
 
    inputGrande: {
        minHeight: 130,
        borderRadius: 28,
        paddingTop: 16,
        paddingBottom: 16,
    },
 
    seletor: {
        ...campo,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
 
    textoSeletor: {
        ...textoCampo,
        flex: 1,
        marginRight: 10,
    },
 
    mensagemErro: {
        fontSize: 17,
        lineHeight: 22,
        fontFamily: "Ruwudu-Regular",
        color: cores.erro,
        backgroundColor: cores.erroClaro,
        borderRadius: 18,
        paddingHorizontal: 18,
        paddingVertical: 9,
        marginTop: 10,
    },
 
    opcaoModo: {
        ...campo,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: 12,
        marginBottom: 10,
    },
 
    opcaoModoSelecionada: {
        ...campoSelecionado,
    },
 
    textoOpcaoModo: {
        ...textoCampo,
        flex: 1,
    },
 
    textoAjuda: {
        fontSize: 17,
        lineHeight: 23,
        fontFamily: "Ruwudu-Regular",
        color: cores.marromMedio,
        backgroundColor: cores.creme,
        borderRadius: 22,
        paddingHorizontal: 20,
        paddingVertical: 13,
        marginTop: 8,
    },
 
    botaoSalvar: {
        backgroundColor: cores.marrom,
        height: 52,
        width: "100%",
        borderRadius: 30,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 30,
    },
 
    textoBotao: {
        color: cores.fundo,
        fontSize: 20,
        fontFamily: "Ruwudu-Bold",
    },
 
    rodape: {
        paddingHorizontal: 22,
        paddingTop: 8,
        paddingBottom: 20,
        alignItems: "flex-start",
        backgroundColor: cores.fundo,
    },
 
    botaoVoltar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: cores.marrom,
        alignItems: "center",
        justifyContent: "center",
    },
 
    fundoModal: {
        flex: 1,
        backgroundColor: "rgba(51, 39, 22, 0.5)",
        justifyContent: "flex-end",
    },
 
    caixaModal: {
        backgroundColor: cores.fundo,
        borderTopLeftRadius: 36,
        borderTopRightRadius: 36,
        paddingTop: 12,
        paddingHorizontal: 22,
        paddingBottom: 24,
        maxHeight: "75%",
    },
 
    puxadorModal: {
        width: 48,
        height: 5,
        borderRadius: 3,
        backgroundColor: cores.bordaCreme,
        alignSelf: "center",
        marginBottom: 16,
    },
 
    tituloModal: {
        fontSize: 26,
        fontFamily: "Ruwudu-Bold",
        color: cores.marrom,
        marginBottom: 12,
        textAlign: "center",
    },
 
    itemModal: {
        ...campo,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        minHeight: 52,
        marginBottom: 8,
    },
 
    itemModalSelecionado: {
        ...campoSelecionado,
    },
 
    textoItemModal: {
        ...textoCampo,
        flex: 1,
    },
 
    fecharModal: {
        backgroundColor: cores.marrom,
        height: 52,
        borderRadius: 30,
        alignItems: "center",
        justifyContent: "center",
                marginTop: 10,
    },

    botaoExcluir: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        height: 52,
        width: "100%",
        borderRadius: 30,
        borderWidth: 1.5,
        borderColor: "#A52C2C",
        marginTop: 12,
    },

    textoExcluir: {
        color: "#A52C2C",
        fontSize: 18,
        fontFamily: "Ruwudu-Bold",
    },
});

