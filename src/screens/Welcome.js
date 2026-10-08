import { View, Text, StyleSheet, Image, Pressable } from 'react-native'; /* componentes básicos do react native; view = div.*/
/* flex-box = algoritmo de layout do react native*/

import * as Font from 'expo-font';
/* importa o expo-font, biblioteca usada para carregar fontes personalizadas no aplicativo. */

import { useEffect, useState } from 'react'; /* importa dois hooks do react; o primeiro guarda/atualiza um valor durante a execução do componente e o segundo executa uma ação quando ele é carregado.*/

export default function Welcome({ navigation }) {
    const [fonteCarregada, setFonteCarregada] = useState(false); /* cria um estado para verficicar se a fonte já terminou de carregar; false no inicio porque não foi carregada ainda.*/

    useEffect(() => { /* executa esse código quando a 'welcome' é carregada.*/
        async function carregarFonte() { /* função responsável por carregar.*/
            await Font.loadAsync({
                'Ruwudu-Regular': require('../../assets/fonts/Ruwudu-Regular.ttf'),
                'Ruwudu-Bold': require('../../assets/fonts/Ruwudu-Bold.ttf'),
            });/* carrega o arquivo da fonte e define o nome p/ utilizá-la nos estilos.*/

            setFonteCarregada(true);
            /* depois que é carregada, o estado vira true.*/
        }

        carregarFonte(); /* chama a função que carrega a fonte.*/

    }, []); /* o [] faz o efeito carregar apenas quando o componente for carregado.*/

    if (!fonteCarregada) {
        return null;
    }/* enquanto a fonte não terminar de carregar, a tela não é exibida; para evitar que o texto apareça primeiramente com a fonte padrão.*/

    return (
        <View style={styles.container}>

            <View style={styles.logoContainer}> {/* top. */}
                <Image
                    source={require('../../assets/images/logo-ofc-png-empty.png')}
                    style={styles.logo}
                />
            </View>

            <View style={styles.conteudo}> {/* bottom/info.*/}

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

                <Pressable
                    style={styles.botao}
                    onPress={() => navigation.navigate('Login')} >

                    <Text style={styles.textoBotao}>
                        Começar
                    </Text>
                </Pressable>


            </View>

        </View >

    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'FFEAC8',
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
        width: 190,
        height: 190,
        resizeMode: 'contain',
    },

    logoContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    /* bloco inferior. */
    conteudo: {
        backgroundColor: '#FA9F2A',
        width: '95%',
        minHeight: 300,
        paddingTop: 50,
        paddingBottom: 40,
        paddingHorizontal: 50,
        borderRadius: 36,
        marginBottom: 10,
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
    },

    saudacao: {
        paddingTop: 15,
        color: '#332716',
        fontFamily: 'Ruwudu-Bold',
        fontSize: 42,
        lineHeight: 40,
    },

    titulo: {
        color: '#332716',
        fontFamily: 'Ruwudu-Bold',
        fontSize: 30,
        lineHeight: 40,
        textAlign: 'left',
        paddingTop: 10,
    },

    descricao: {
        color: '#332716',
        fontFamily: 'Ruwudu-Regular',
        fontSize: 25,
        marginTop: 5,
        lineHeight: 30,
        textAlign: 'left',
    },

    botao: {
        backgroundColor: '#332716',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 15,
        marginTop: 25,
        alignItems: 'center',
    },

    textoBotao: {
        color: '#FFEAC8',
        fontFamily: 'Ruwudu-Bold',
        fontSize: 18,
    },
});
