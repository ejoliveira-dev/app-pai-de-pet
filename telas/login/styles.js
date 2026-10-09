import { Dimensions, StyleSheet } from "react-native";

export const style = StyleSheet.create({

    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },

    boxTop: {
        height: Dimensions.get('window').height / 3,
        backgroundColor: '#FFFDF8',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center'
    },

    boxMid: {
        height: Dimensions.get('window').height / 4,
        backgroundColor: '#FFFDF8',
        width: '100%',
        alignItems:'center',
        justifyContent: 'flex-end',
        paddingBottom: 5
    },

    boxBottom: {
    height: Dimensions.get('window').height / 3,
    backgroundColor: '#FFFDF8',
    width: '100%',
    alignItems: 'center',
    paddingTop: 10
    },

    logo: {
        width: 200,
        height: 200
    },
    
        input: {
        width: '90%',
        borderWidth: 1,
        borderColor: 'black',
        borderRadius: 15,
        paddingHorizontal: 10,
        backgroundColor: 'white',
        alignItems: 'center',
        marginBottom: 25,
    },

    botao:{
        backgroundColor: '#d8821f',
        width: 200,
        height: 45,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center'
    },

    textoBotao:{
        color: '#FFFDF8',
        fontSize: 20,
        fontWeight: 'bold',
    },

    contaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginTop: 15
    },

    linkCriarConta: {
        color: '#375d86',
        textDecorationLine: 'underline',
        fontWeight: 'bold'
    }

    })