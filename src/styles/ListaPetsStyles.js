import { StyleSheet } from "react-native";

// paleta do Tutus 
const cores = {
    fundo: "#FFFDF8",
    branco: "#FFFFFF",
    laranja: "#FA9F2A",
    laranjaClaro: "#FFEAC8",
    creme: "#FFF1DC",
    bordaCreme: "#F2DFC4",
    bordaCartao: "#F5D7A8",
    marrom: "#332716",
    marromMedio: "#75571F",
};

export const style = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: cores.laranja,
    },

    scroll: {
        flex: 1,
    },

    conteudo: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingTop: 25,
        paddingBottom: 25,
        backgroundColor: cores.fundo,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        marginTop: 0,
    },

    // logo
    boxLogo: {
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 18,
    },

    logo: {
        width: 110,
        height: 110,
    },

    // cabeçalho 
    cabecalho: {
        backgroundColor: cores.laranja,
        borderRadius: 36,
        paddingTop: 28,
        paddingBottom: 28,
        paddingHorizontal: 30,
        marginBottom: 30,
        overflow: "hidden",
    },

    cabecalhoCirculo: {
        position: "absolute",
        top: -30,
        right: -30,
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: cores.laranjaClaro,
        opacity: 0.3,
    },

    saudacao: {
        fontSize: 30,
        lineHeight: 36,
        fontFamily: "Ruwudu-Bold",
        color: cores.marrom,
    },

    titulo: {
        fontSize: 27,
        lineHeight: 34,
        fontFamily: "Ruwudu-Bold",
        color: cores.marrom,
        marginTop: 6,
    },

    subtitulo: {
        fontSize: 20,
        lineHeight: 28,
        fontFamily: "Ruwudu-Regular",
        color: cores.marrom,
        marginTop: 8,
    },

    // seção da roleta
    secaoRoleta: {
        marginBottom: 20,
    },

    cabecalhoSecao: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
        paddingHorizontal: 4,
    },

    tituloSecao: {
        fontSize: 26,
        fontFamily: "Ruwudu-Bold",
        color: cores.marrom,
    },

    contador: {
        backgroundColor: cores.creme,
        borderWidth: 1,
        borderColor: cores.bordaCreme,
        borderRadius: 20,
        minWidth: 34,
        height: 30,
        paddingHorizontal: 12,
        alignItems: "center",
        justifyContent: "center",
    },

    textoContador: {
        fontSize: 17,
        fontFamily: "Ruwudu-Bold",
        color: cores.marromMedio,
    },

    listaRoleta: {
        paddingVertical: 8,
        paddingHorizontal: 2,
    },

    itemRoleta: {
        width: 92,
        alignItems: "center",
        justifyContent: "flex-start",
        marginRight: 12,
        paddingTop: 8,
    },

    avatarBorda: {
        width: 74,
        height: 74,
        borderRadius: 37,
        padding: 4,
        borderWidth: 2,
        borderColor: cores.bordaCreme,
        backgroundColor: cores.branco,
        alignItems: "center",
        justifyContent: "center",
    },

    avatarSelecionado: {
        width: 74,
        height: 74,
        borderRadius: 37,
        padding: 3,
        borderWidth: 3,
        borderColor: cores.laranja,
        backgroundColor: cores.laranjaClaro,
        alignItems: "center",
        justifyContent: "center",
    },

    avatarImagem: {
        width: "100%",
        height: "100%",
        borderRadius: 50,
    },

    avatarSemFoto: {
        flex: 1,
        width: "100%",
        borderRadius: 50,
        backgroundColor: cores.creme,
        alignItems: "center",
        justifyContent: "center",
    },

    nomeRoleta: {
        maxWidth: 88,
        fontSize: 18,
        fontFamily: "Ruwudu-Regular",
        color: cores.marromMedio,
        marginTop: 8,
        textAlign: "center",
    },

    nomeRoletaSelecionado: {
        fontFamily: "Ruwudu-Bold",
        color: cores.marrom,
    },

    indicadorSelecionado: {
        width: 22,
        height: 5,
        borderRadius: 3,
        backgroundColor: cores.laranja,
        marginTop: 4,
    },

    // cartão do pet selecionado
    cartaoDestaque: {
        position: "relative",
        alignItems: "center",
        backgroundColor: cores.branco,
        borderRadius: 36,
        borderWidth: 1.5,
        borderColor: cores.bordaCartao,
        paddingTop: 10,
        paddingBottom: 26,
        paddingHorizontal: 24,
        marginTop: 10,
        marginBottom: 22,
        overflow: "hidden",

        shadowColor: cores.marrom,
        shadowOffset: {
            width: 0,
            height: 6,
        },
        shadowOpacity: 0.09,
        shadowRadius: 12,
        elevation: 4,
    },

    faixaDecorativa: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 78,
        backgroundColor: cores.creme,
    },

    detalheDecorativo: {
        position: "absolute",
        top: 16,
        right: 18,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: cores.laranjaClaro,
        alignItems: "center",
        justifyContent: "center",
    },

    fotoDestaque: {
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 5,
        borderColor: cores.laranja,
        backgroundColor: cores.creme,
        marginBottom: 16,
    },

    fotoDestaqueSemFoto: {
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 5,
        borderColor: cores.laranja,
        backgroundColor: cores.creme,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },

    etiquetaDestaque: {
        fontSize: 14,
        letterSpacing: 2,
        fontFamily: "Ruwudu-Bold",
        color: cores.laranja,
        marginBottom: 2,
    },

    nomeDestaque: {
        fontSize: 34,
        lineHeight: 40,
        fontFamily: "Ruwudu-Bold",
        color: cores.marrom,
        textAlign: "center",
    },

    especieDestaque: {
        fontSize: 19,
        fontFamily: "Ruwudu-Regular",
        color: cores.marromMedio,
        textAlign: "center",
    },

    chipEspecie: {
        backgroundColor: cores.creme,
        borderWidth: 1,
        borderColor: cores.bordaCreme,
        borderRadius: 20,
        paddingHorizontal: 18,
        paddingVertical: 3,
        marginTop: 8,
    },

    botaoVerPerfil: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: cores.marrom,
        borderRadius: 30,
        height: 50,
        width: "100%",
        marginTop: 22,
        paddingHorizontal: 20,
        gap: 10,
    },

    textoVerPerfil: {
        color: cores.fundo,
        fontSize: 20,
        fontFamily: "Ruwudu-Bold",
    },

    // cartão de adicionar pet
    adicionarContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: cores.creme,
        borderRadius: 30,
        borderWidth: 2,
        borderStyle: "dashed",
        borderColor: cores.laranja,
        paddingVertical: 16,
        paddingHorizontal: 18,
        marginTop: 4,
        marginBottom: 10,
    },

    botaoCircular: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: cores.laranja,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 4,
        borderColor: cores.laranjaClaro,
    },

    textosAdicionar: {
        flex: 1,
        marginLeft: 16,
    },

    textoAdicionar: {
        fontSize: 23,
        fontFamily: "Ruwudu-Bold",
        color: cores.marrom,
    },

    subtextoAdicionar: {
        fontSize: 17,
        lineHeight: 22,
        fontFamily: "Ruwudu-Regular",
        color: cores.marromMedio,
        marginTop: 1,
    },

    // tela sem pets ou carregamento
    estadoVazio: {
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: cores.branco,
        borderRadius: 36,
        borderWidth: 1.5,
        borderColor: cores.bordaCartao,
        paddingHorizontal: 24,
        paddingVertical: 34,
        marginBottom: 22,
    },

    ilustracaoVazia: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: cores.creme,
        borderWidth: 4,
        borderColor: cores.laranjaClaro,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 18,
    },

    tituloVazio: {
        fontSize: 28,
        lineHeight: 34,
        fontFamily: "Ruwudu-Bold",
        color: cores.marrom,
        textAlign: "center",
        marginBottom: 8,
    },

    textoEstado: {
        fontSize: 19,
        lineHeight: 26,
        fontFamily: "Ruwudu-Regular",
        color: cores.marromMedio,
        textAlign: "center",
        marginTop: 10,
    },

    // rodapé
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

    painelBranco: {
        flex: 1,
        backgroundColor: "#FFFDF8",
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        marginTop: -28,
        overflow: "hidden",
    },

    saudacao: {
        fontSize: 45,
        fontFamily: "Ruwudu-Bold",
        color: "#332716",
        textAlign: "left",
    },

    avatarAdicionar: {
        width: 74,
        height: 74,
        borderRadius: 34,
        borderWidth: 2,
        borderColor: "#FA9F2A",
        borderStyle: "dashed",
        backgroundColor: "#FFF1DC",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
    },

    iconeMais: {
        position: "absolute",
        right: -3,
        bottom: -3,
        width: 23,
        height: 23,
        borderRadius: 12,
        backgroundColor: "#FA9F2A",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: "#FFFDF8",
    },

});
