import { StyleSheet } from "react-native";

import * as Font from 'expo-font';

export const style = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: '#FFFDF8',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 25,
        paddingVertical: 30,
    },

    boxTop: {
        marginBottom: 15,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center'
    },

    boxMid: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: 5
    },

    boxBottom: {
        width: '100%',
        alignItems: 'center',
        paddingTop: 10
    },

    logo: {
        width: 200,
        height: 200,
        resizeMode: 'contain',
    },

    input: {
        width: '90%',
        borderWidth: 1,
        borderColor: '#FA9F2A',
        borderWidth: 1,
        borderRadius: 15,
        paddingHorizontal: 18,
        backgroundColor: 'white',
        alignItems: 'center',
        marginBottom: 25,
        fontSize: 16,
    },

    botao: {
        backgroundColor: '#332716',
        width: 200,
        height: 50,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center'
    },

    textoBotao: {
        color: '#FFFDF8',
        fontSize: 20,
        fontFamily: 'Ruwudu-Bold',
    },

    contaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        flexWrap: 'wrap',
        marginTop: 20,
        gap: 5,
    },

    linkCriarConta: {
        color: '#FA9F2A',
        textDecorationLine: 'underline',
        fontFamily: 'Ruwudu-Bold',
        fontSize: 18,
    },

    boxTitulo: {
        marginBottom: 25,
        width: '100%',
        alignItems: 'center',
        backgroundColor: '#FA9F2A',
        borderRadius: 25,
        paddingVertical: 20,
        paddingHorizontal: 20,
        alignItems: 'center',
        marginBottom: 25,
    },

    titulo: {
        fontFamily: 'Ruwudu-Bold',
        fontSize: 25,
        color: '#332716',
        textAlign: 'center',
        lineHeight: 36,
    },

    subtitulo: {
        fontFamily: 'Ruwudu-Regular',
        fontSize: 18,
        color: '#332716',
        textAlign: 'center',
        marginTop: 0,
        lineHeight: 27,
    },

    textoConta: {
        fontSize: 15,
        color: '#332716',
        fontFamily: 'Ruwudu-Bold',
        fontSize: 18,
    },

    rodape: {
        position: 'absolute',
        bottom: 25,
        left: 25,

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

    socialContainer: {
        width: '100%',
        alignItems: 'center',
        marginTop: 25,
        marginBottom: 15,
    },

    divisor: {
        width: '90%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },

    linha: {
        flex: 1,
        height: 1,
        backgroundColor: '#C9B89D',
    },

    textoDivisor: {
        fontFamily: 'Ruwudu-Regular',
        fontSize: 16,
        color: '#75571F',
        textAlign: 'center',
    },

    socialBotoes: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 25,
        marginTop: 15,
    },

    socialBotao: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#FFEAC8',
        alignItems: 'center',
        justifyContent: 'center',
    },
})