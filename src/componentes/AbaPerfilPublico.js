
import React, { useRef, useState, useMemo } from "react";
import { View, Text, Image, Pressable, ScrollView, StyleSheet, Animated, PanResponder, useWindowDimensions } from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ALTURA_FECHADA = 125;

export default function AbaPerfilPublico() {
    const { height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const alturaExpandida = height * 0.75;

    const [aberto, setAberto] = useState(false);
    const [mostrarFundo, setMostrarFundo] = useState(false);

    const animacao = useRef(new Animated.Value(0)).current;

    // isso abre o painel.
    function abrirPerfil() {
        setMostrarFundo(true);
        setAberto(true);

        Animated.timing(animacao, {
            toValue: 1,
            duration: 350,
            useNativeDriver: false,
        }).start();
    }

    // isso fecha o painel.
    function fecharPerfil() {
        setAberto(false);

        Animated.timing(animacao, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false,
        }).start(({ finished }) => {
            if (finished) {
                setMostrarFundo(false);
            }
        });
    }

    // isso reconhece o gesto de arrastar.
    const gesto = useMemo(() => PanResponder.create({
        onMoveShouldSetPanResponder: (_, movimento) => {
            return (
                Math.abs(movimento.dy) > 12 &&
                Math.abs(movimento.dy) > Math.abs(movimento.dx)
            );
        },

        onPanResponderRelease: (_, movimento) => {
            if (movimento.dy > 50) {
                abrirPerfil();
            }

            if (movimento.dy < -50) {
                fecharPerfil();
            }
        },
    }), [aberto]);

    // essa é altura animada do painel.
    const alturaPainel = animacao.interpolate({
        inputRange: [0, 1],
        outputRange: [ALTURA_FECHADA, alturaExpandida],
    });

    return (
        <View
            style={styles.containerAba}
            pointerEvents="box-none"
        >

            {/* fundo escuro sobre o Feed */}
            {mostrarFundo && (
                <Animated.View
                    style={[
                        styles.fundoEscuro,
                        { opacity: animacao }
                    ]}
                >
                    <Pressable
                        style={StyleSheet.absoluteFillObject}
                        onPress={fecharPerfil}
                    />
                </Animated.View>
            )}

            {/* painel que cresce para baixo */}
            <Animated.View
                style={[
                    styles.painel,
                    {
                        height: alturaPainel,
                        top: insets.top,
                    }
                ]}
            >

                {/* parte que o usuário puxa */}
                <View {...gesto.panHandlers}>

                    <View {...gesto.panHandlers}>

                        {/* barrinha para arrastar */}
                        <View style={styles.indicadorContainer}>
                            <View style={styles.indicador} />
                        </View>

                        {/* cabeçalho do pet */}
                        <Pressable
                            style={styles.cabecalho}
                            onPress={aberto ? fecharPerfil : abrirPerfil}
                        >
                            <Image
                                source={require("../../assets/images/pet1.jpg")}
                                style={styles.fotoPet}
                            />

                            <View style={styles.infoPet}>
                                <Text style={styles.nomePet}>
                                    Estavão
                                </Text>

                                <Text style={styles.dadosPet}>
                                    Hamster • 6 meses
                                </Text>
                            </View>

                            <Ionicons
                                name={aberto ? "chevron-up" : "chevron-down"}
                                size={26}
                                color="#332716"
                            />
                        </Pressable>

                    </View>

                </View>

                {/* conteúdo visível quando expandido */}
                {aberto && (
                    <ScrollView
                        style={styles.perfilExpandido}
                        contentContainerStyle={styles.perfilConteudo}
                        showsVerticalScrollIndicator={false}
                    >

                        <Text style={styles.tituloSecao}>
                            Perfil público
                        </Text>

                        <Text style={styles.biografia}>
                            Um hamster cheio de personalidade! 🐹
                        </Text>

                        <View style={styles.divisor} />

                        <Text style={styles.tituloSecao}>
                            Minhas publicações
                        </Text>

                        <View style={styles.fotosContainer}>

                            <Image
                                source={require("../../assets/images/pet1.jpg")}
                                style={styles.fotoPublicacao}
                            />

                            <Image
                                source={require("../../assets/images/pet1.jpg")}
                                style={styles.fotoPublicacao}
                            />

                            <Image
                                source={require("../../assets/images/pet1.jpg")}
                                style={styles.fotoPublicacao}
                            />

                        </View>

                        <View style={styles.publicar}>
                            <Ionicons
                                name="add-circle-outline"
                                size={22}
                                color="#332716"
                            />

                            <Text style={styles.textoPublicar}>
                                Nova publicação (em breve)
                            </Text>
                        </View>

                    </ScrollView>
                )}

            </Animated.View>

        </View>
    );
}

const styles = StyleSheet.create({

    fundoEscuro: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(30, 23, 15, 0.55)",
    },

    painel: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: "#FFEAC8",
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        overflow: "hidden",
        elevation: 12,
        zIndex: 12,
    },

    cabecalho: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 22,
        paddingTop: 15,
        paddingBottom: 5,
    },

    fotoPet: {
        width: 62,
        height: 62,
        borderRadius: 31,
    },

    infoPet: {
        flex: 1,
        marginLeft: 15,
    },

    nomePet: {
        fontFamily: "Ruwudu-Bold",
        fontSize: 24,
        color: "#332716",
    },

    dadosPet: {
        fontFamily: "Ruwudu-Regular",
        fontSize: 16,
        color: "#75571F",
        marginTop: -5,
    },

    indicadorContainer: {
        alignItems: "center",
        paddingTop: 9,
        paddingBottom: 8,
    },

    indicador: {
        width: 42,
        height: 4,
        borderRadius: 10,
        backgroundColor: "#B89967",
    },

    perfilExpandido: {
        flex: 1,
        backgroundColor: "#FFFDF8",
        marginTop: 10,
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
    },

    perfilConteudo: {
        paddingHorizontal: 25,
        paddingVertical: 25,
        paddingBottom: 40,
    },

    tituloSecao: {
        fontFamily: "Ruwudu-Bold",
        fontSize: 25,
        color: "#332716",
        marginBottom: 12,
    },

    biografia: {
        fontFamily: "Ruwudu-Regular",
        fontSize: 18,
        color: "#75571F",
    },

    divisor: {
        height: 1,
        backgroundColor: "#E9DCC6",
        marginVertical: 20,
    },

    fotosContainer: {
        flexDirection: "row",
        gap: 8,
        marginTop: 10,
        marginBottom: 25,
    },

    fotoPublicacao: {
        flex: 1,
        height: 100,
        borderRadius: 12,
    },

    publicar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        backgroundColor: "#FFEAC8",
        borderRadius: 20,
        padding: 15,
    },

    textoPublicar: {
        fontFamily: "Ruwudu-Bold",
        fontSize: 17,
        color: "#332716",
    },

    containerAba: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 100,
    },
});
