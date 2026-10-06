import { View, Text, StyleSheet, Image } from 'react-native'; /* componentes básicos do react native; view = div.*/
/* flex-box = algoritmo de layout do react native*/

import * as Font from 'expo-font';
/* importa o expo-font, biblioteca usada para carregar fontes personalizadas no aplicativo. */

import { useEffect, useState } from 'react'; /* importa dois hooks do react; o primeiro guarda/atualiza um valor durante a execução do componente e o segundo executa uma ação quando ele é carregado.*/

export default function Welcome() {
    const [fonteCarregada, setFonteCarregada] = useState(false); /* cria um estado para verficicar se a fonte já terminou de carregar; false no inicio porque não foi carregada ainda.*/

    useEffect(() => { /* executa esse código quando a 'welcome' é carregada.*/
        async function carregarFonte() { /* função responsável por carregar.*/
            await Font.loadAsync({
                'Ruwudu-Regular': require('../../assets/fonts/Ruwudu-Regular.ttf'),
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

                <Text style={styles.titulo}>
                    Bem-vindo ao Tutus.
                </Text>

                <Text style={styles.descricao}>
                    Cuide, organize e compartilhe a rotina de seu pet com outros amigos tutores!
                </Text>
            </View>

        </View>

    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFEAC8',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    texto: {
        color: '332716',
        fontFamily: 'Ruwudu-Regular',
        fontSize: 30,
    },

    logo: {
        width: 200,
        height: 200,
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
        padding: 80,
        borderRadius: 28,
        marginBottom: 10,
        
        alignItems: 'flex-start',
    },

    titulo: {
        color: '332716',
        fontFamily: 'Ruwudu-Bold',
        fontSize: 30,

        textAlign: 'left',
    },

    descricao: {
        color: '#332716',
        fontFamily: 'Ruwudu-Regular',
        fontSize: 25,
        marginTop: 8,

        textAlign: 'left',
    },
});
