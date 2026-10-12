import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import AbaPerfilPublico from "../componentes/AbaPerfilPublico";

export default function Comunidade() {

    return (
        <View style={styles.container}>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.conteudo}
                showsVerticalScrollIndicator={false}
            >
                {/* feed */}
                <View style={styles.linhaFeed}>
                    <Text style={styles.tituloFeed}>
                        Feed
                    </Text>

                    <TouchableOpacity
                        style={styles.botaoPublicar}
                        onPress={() =>
                            Alert.alert(
                                'Nova publicação',
                                'Essa funcionalidade será desenvolvida em breve.'
                            )
                        }
                    >
                        <Ionicons
                            name="add"
                            size={21}
                            color="#FFFDF8"
                        />

                        <Text style={styles.textoPublicar}>
                            Publicar
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* publicação de exemplo */}
                <View style={styles.cardPublicacao}>

                    <View style={styles.cabecalhoPost}>
                        <Image
                            source={require('../../assets/images/pet2.png')}
                            style={styles.fotoPost}
                        />

                        <View style={styles.infoPost}>
                            <Text style={styles.autorPost}>
                                Jully
                            </Text>

                            <Text style={styles.dataPost}>
                                Publicação de exemplo
                            </Text>
                        </View>

                        <Ionicons
                            name="ellipsis-horizontal"
                            size={23}
                            color="#332716"
                        />
                    </View>

                    <Image
                        source={require('../../assets/images/pet2.png')}
                        style={styles.imagemPost}
                        resizeMode="cover"
                    />

                    <Text style={styles.legendaPost}>
                        Curtindo uma tarde tranquila! 🐾
                    </Text>

                    <View style={styles.acoesPost}>
                        <Ionicons name="heart-outline" size={25} color="#332716" />
                        <Ionicons name="chatbubble-outline" size={23} color="#332716" />
                        <Ionicons name="paper-plane-outline" size={23} color="#332716" />
                    </View>

                </View>

            </ScrollView>

            <AbaPerfilPublico />

        </View>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: '#FFFDF8',
    },

    conteudo: {
        paddingHorizontal: 22,
        paddingTop: 150,
        paddingBottom: 35,
    },

    cabecalho: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 25,
    },

    titulo: {
        fontFamily: 'Ruwudu-Bold',
        fontSize: 32,
        color: '#332716',
    },

    subtitulo: {
        fontFamily: 'Ruwudu-Regular',
        fontSize: 16,
        color: '#75571F',
    },

    // perfil público

    cardPerfil: {
        backgroundColor: '#FFEAC8',
        borderRadius: 22,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
    },

    fotoPerfil: {
        width: 65,
        height: 65,
        borderRadius: 33,
        marginRight: 14,
    },

    infoPerfil: {
        flex: 1,
    },

    nomePet: {
        fontFamily: 'Ruwudu-Bold',
        fontSize: 23,
        color: '#332716',
    },

    textoPerfil: {
        fontFamily: 'Ruwudu-Regular',
        fontSize: 15,
        color: '#75571F',
    },

    dicaPerfil: {
        fontFamily: 'Ruwudu-Regular',
        fontSize: 13,
        color: '#75571F',
    },

    // feed

    linhaFeed: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 18,
    },

    tituloFeed: {
        fontFamily: 'Ruwudu-Bold',
        fontSize: 26,
        color: '#332716',
    },

    botaoPublicar: {
        backgroundColor: '#332716',
        borderRadius: 30,
        paddingHorizontal: 18,
        height: 44,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
    },

    textoPublicar: {
        fontFamily: 'Ruwudu-Bold',
        fontSize: 16,
        color: '#FFFDF8',
    },

    // publicações

    cardPublicacao: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#EADFCB',
        borderRadius: 22,
        padding: 15,
        marginBottom: 20,
    },

    cabecalhoPost: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },

    fotoPost: {
        width: 45,
        height: 45,
        borderRadius: 23,
        marginRight: 10,
    },

    infoPost: {
        flex: 1,
    },

    autorPost: {
        fontFamily: 'Ruwudu-Bold',
        fontSize: 19,
        color: '#332716',
    },

    dataPost: {
        fontFamily: 'Ruwudu-Regular',
        fontSize: 13,
        color: '#75571F',
    },

    imagemPost: {
        width: '100%',
        height: 230,
        borderRadius: 15,
    },

    legendaPost: {
        fontFamily: 'Ruwudu-Regular',
        fontSize: 16,
        color: '#332716',
        marginTop: 12,
    },

    acoesPost: {
        flexDirection: 'row',
        gap: 20,
        marginTop: 15,
    },

    painelPerfil: {
        backgroundColor: '#FFFDF8',
        borderRadius: 28,
        marginHorizontal: 15,
        marginTop: 45,
        padding: 22,
        height: '78%',
    },

    topoPainel: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },

    tituloPainel: {
        fontFamily: 'Ruwudu-Bold',
        fontSize: 24,
        color: '#332716',
    },

    dadosPublicos: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },

    fotoPublica: {
        width: 85,
        height: 85,
        borderRadius: 43,
        marginRight: 15,
    },

    textoDescricao: {
        fontFamily: 'Ruwudu-Regular',
        fontSize: 16,
        color: '#75571F',
        marginBottom: 25,
    },

    tituloPublicacoes: {
        fontFamily: 'Ruwudu-Bold',
        fontSize: 21,
        color: '#332716',
        marginBottom: 15,
    },

    gradeFotos: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },

    fotoGrade: {
        width: 100,
        height: 100,
        borderRadius: 12,
    },

    avisoExemplo: {
        fontFamily: 'Ruwudu-Regular',
        fontSize: 14,
        color: '#75571F',
        marginTop: 15,
    },

});