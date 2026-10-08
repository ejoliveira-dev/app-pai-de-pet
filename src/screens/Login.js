import { View, Text, StyleSheet, Pressable } from 'react-native';

export default function Login({navigation}) {
    return (
        <View style={styles.container}>
            <Text>Tela de Login</Text>

            <Pressable
                style={styles.botao}
                onPress={() => navigation.navigate('Home')}
            >
                <Text style={styles.textoBotao}>
                    Ir para Home
                </Text>
            </Pressable>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    botao: {
        backgroundColor: '#332716',
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 12,
        marginTop: 20,
    },

    textoBotao: {
        color: '#FFEAC8',
    },
});