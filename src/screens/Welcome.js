import { View, Text, StyleSheet } from 'react-native';

export default function Welcome() {
    return (
        <View style={styles.container}>
            <Text style={styles.texto}>Bem-vindo ao Tutus!</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    texto: {
        fontFamily: 'Ruwudu-Regular',
        fontSize: 30,
    },
});
