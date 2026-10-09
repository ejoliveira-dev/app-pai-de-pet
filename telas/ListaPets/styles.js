
import { StyleSheet } from "react-native";

export const style = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FAF7F0",
        paddingHorizontal: 22,
        paddingTop: 65
    },

    titulo: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#653719",
        marginBottom: 35
    },

    petCard: {
        width: "100%",
        minHeight: 110,
        backgroundColor: "#FFFDF8",
        borderWidth: 1,
        borderColor: "#DED5C8",
        borderRadius: 16,
        padding: 14,
        flexDirection: "row",
        alignItems: "center"
    },

    petImagem: {
        width: 65,
        height: 65,
        borderRadius: 35,
        backgroundColor: "#F1E4D2"
    },

    petInfo: {
        flex: 1,
        marginLeft: 15
    },

    petNome: {
        fontSize: 21,
        fontWeight: "bold",
        color: "#59341F"
    },

    petTipo: {
        fontSize: 16,
        color: "#89796C",
        marginTop: 4
    },

    seta: {
        fontSize: 34,
        color: "#653719"
    },

    botao: {
        height: 55,
        backgroundColor: "#8B4513",
        borderRadius: 30,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 30
    },

    textoBotao: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "bold"
    }
    
});