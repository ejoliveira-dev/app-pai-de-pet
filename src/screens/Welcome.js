import { View, Text, StyleSheet, Image, Pressable, TouchableOpacity } from 'react-native'; /* componentes básicos do react native; view = div.*/
/* flex-box = algoritmo de layout do react native*/

import React from 'react';

export default function Welcome({ navigation }) {

    return (
        <View style={styles.container}>
             
            {/* top. */}
            <View style={styles.logoContainer}> 
                <Image
                    source={require('../../assets/images/logo-ofc-png-empty2.png')}
                    style={styles.logo}
                />
            </View>
            
            {/* bottom/info.*/}
            <View style={styles.conteudo}> 

                <Text style={styles.saudacao}>
                    Olá, humano!
                </Text>

                <Text style={styles.titulo}>
                    Bem-vindo ao Tutus.
                </Text>

                <View>

                    <Text style={styles.descricao}>
                        Pronto para cuidar, organizar e compartilhar a rotina do seu pet com outros amigos tutores?
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.botao}
                    onPress={() => navigation.navigate('Login')} >

                    <Text style={styles.textoBotao}>
                        Começar
                    </Text>
                </TouchableOpacity>


            </View>

        </View >

    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFDF8',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    texto: {
        color: '#332716',
        fontFamily: 'Ruwudu-Regular',
        fontSize: 30,
    },

    logo: {
        width: 250,
        height: 250,
        resizeMode: 'contain',
    },

    logoContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 65,
    },

    /* bloco inferior. */
    conteudo: {
        backgroundColor: '#FA9F2A',
        width: '95%',
        minHeight: 300,
        paddingTop: 40,
        paddingBottom: 40,
        paddingHorizontal: 50,
        borderRadius: 36,
        marginBottom: 30,
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
    },

    saudacao: {
        paddingTop: 15,
        color: '#332716',
        fontFamily: 'Ruwudu-Bold',
        fontSize: 36,
        lineHeight: 40,
    },

    titulo: {
        color: '#332716',
        fontFamily: 'Ruwudu-Bold',
        fontSize: 27,
        lineHeight: 40,
        textAlign: 'left',
        paddingTop: 10,
    },

    descricao: {
        color: '#332716',
        fontFamily: 'Ruwudu-Regular',
        fontSize: 21,
        marginTop: 5,
        lineHeight: 30,
        textAlign: 'left',
    },

    botao: {
        backgroundColor: '#332716',
        marginTop: 20,
        width: 200,
        height: 50,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center'
    },

    textoBotao: {
        color: '#FFFDF8',
        fontFamily: 'Ruwudu-Bold',
        fontSize: 20,
    },
});
