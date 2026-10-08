import { View, StyleSheet, Image } from 'react-native';

import { useEffect } from 'react';

export default function Splash({ navigation }) {
    /* o 'navigation' permite navegar entre telas. */

    useEffect(() => {
        /* cria um tempo de espera antes de sair da Splash. */
        const timer = setTimeout(() => {

            /* substitui a Splash pela tela Welcome. */
            navigation.replace('Welcome'); /* aqui está 'replace' porque se tivesse 'navigate' o usuário poderia voltar para splash. */

        }, 2000); /* 2000 milisegundos = 2 seg. */

        /* limpa o temporizador caso a tela seja desmontada antes. */
        return () => clearTimeout(timer);

    }, [navigation]);
    return (
        <View style={styles.container}>
            <Image
                source={require('../../assets/images/logo-ofc-png-empty2.png')}
                style={styles.logo}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
    },

    logo: {
        width: 200,
        height: 200,
        resizeMode: 'contain',
    },
});