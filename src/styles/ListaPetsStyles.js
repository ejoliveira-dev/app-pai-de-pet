
import { StyleSheet } from "react-native";

export const style = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFDF8",
        paddingHorizontal: 22,
        paddingTop: 65
    },

    titulo: {
        fontSize: 35,
        fontFamily: 'Ruwudu-Bold',
        color: "#332716",
        marginBottom: 10,
    },

    petCard: {
        width: "100%",
        minHeight: 110,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#FA9F2A",
        borderRadius: 20,
        padding: 14,
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 15
    },

    petImagem: {
        width: 65,
        height: 65,
        borderRadius: 35,
        backgroundColor: "#FFEAC8"
    },

    petInfo: {
        flex: 1,
        marginLeft: 15
    },

    petNome: {
        fontSize: 25,
        fontFamily: 'Ruwudu-Bold',
        color: "#FA9F2A"
    },

    petTipo: {
        fontSize: 18,
        color: "#75571F",
        marginTop: -15,
        fontFamily: 'Ruwudu-Regular',
    },

    seta: {
        fontSize: 34,
        color: "#332716"
    },

    botao: {
        height: 55,
        backgroundColor: "#332716",
        borderRadius: 30,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 20
    },

    textoBotao: {
        color: "#FFFDF8",
        fontSize: 18,
        fontFamily: 'Ruwudu-Bold',
    },

    rodape: {
        marginTop: 'auto',
        paddingBottom: 25,
        paddingTop: 10,
        alignItems: 'flex-start',

    },

    botaoVoltar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#332716',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
    },

});