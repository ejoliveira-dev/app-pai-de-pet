
import React, { useRef, useState, useMemo, useEffect, useCallback } from "react";
import { View, Text, Image, Pressable, ScrollView, StyleSheet, Animated, PanResponder, useWindowDimensions, TextInput, Modal } from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from '@react-navigation/native';

const ALTURA_FECHADA = 96;

function calcularIdadePet(pet) {
    if (!pet) return "";

    if (!pet.data_nascimento) {
        return pet.idade_Aproximada || "Idade não informada";
    }

    const [dia, mes, ano] = pet.data_nascimento
        .split("/")
        .map(Number);

    const nascimento = new Date(ano, mes - 1, dia);
    const hoje = new Date();

    if (
        nascimento.getFullYear() !== ano ||
        nascimento.getMonth() !== mes - 1 ||
        nascimento.getDate() !== dia ||
        nascimento > hoje
    ) {
        return "Idade não informada";
    }

    let totalMeses =
        (hoje.getFullYear() - ano) * 12 +
        hoje.getMonth() - (mes - 1);

    if (hoje.getDate() < dia) {
        totalMeses--;
    }

    const anos = Math.floor(totalMeses / 12);
    const meses = totalMeses % 12;

    if (anos === 0) {
        return totalMeses === 0
            ? "Menos de 1 mês"
            : `${meses} ${meses === 1 ? "mês" : "meses"}`;
    }

    return `${anos} ${anos === 1 ? "ano" : "anos"}`;
}

export default function AbaPerfilPublico({
    pet,
    publicacoes = [],
    onPublicar
}) {
    const { height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const alturaExpandida = height * 0.75;

    const [aberto, setAberto] = useState(false);
    const [mostrarFundo, setMostrarFundo] = useState(false);

    const [bio, setBio] = useState("");
    const [editandoBio, setEditandoBio] = useState(false);


    const [tutorPublico, setTutorPublico] = useState(null);
    const [modalTutor, setModalTutor] = useState(false);

    useFocusEffect(
        useCallback(() => {
            let ativo = true;

            async function carregarTutor() {
                try {
                    const dados = await AsyncStorage.getItem(
                        '@tutus:perfilTutor'
                    );

                    const tutor = dados ? JSON.parse(dados) : null;

                    if (ativo) {
                        setTutorPublico(
                            tutor?.exibirNoPerfilPublico &&
                                tutor?.nome?.trim()
                                ? tutor
                                : null
                        );
                    }

                } catch (erro) {
                    console.error('Erro ao carregar tutor público:', erro);
                    if (ativo) setTutorPublico(null);
                }
            }

            carregarTutor();

            return () => {
                ativo = false;
            };
        }, [])
    );


    useEffect(() => {
        let ativo = true;

        setBio("");
        setEditandoBio(false);

        async function carregarBio() {
            if (!pet?.id_pet) return;

            try {
                const salva = await AsyncStorage.getItem(
                    `@tutus:bioPublica:${pet.id_pet}`
                );

                if (ativo) {
                    setBio(salva || "");
                }
            } catch (erro) {
                console.error("Erro ao carregar bio:", erro);
            }
        }

        carregarBio();

        return () => {
            ativo = false;
        };
    }, [pet?.id_pet]);

    async function salvarBio() {
        if (!pet?.id_pet) return;

        try {
            await AsyncStorage.setItem(
                `@tutus:bioPublica:${pet.id_pet}`,
                bio.trim()
            );

            setBio(bio.trim());
            setEditandoBio(false);

        } catch (erro) {
            console.error("Erro ao salvar bio:", erro);
        }
    }

    const fotosPet = publicacoes.filter(
        (publicacao) =>
            pet &&
            String(publicacao.id_pet) === String(pet.id_pet) &&
            publicacao.foto_uri
    );

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

                    {/* barrinha para arrastar */}
                    <View style={styles.indicadorContainer}>
                        <View style={styles.indicador} />
                    </View>

                    {/* cabeçalho do pet */}
                    <Pressable
                        style={styles.cabecalho}
                        onPress={aberto ? fecharPerfil : abrirPerfil}
                    >
                        {pet?.foto_perfil ? (
                            <Image
                                source={{ uri: pet.foto_perfil }}
                                style={styles.fotoPet}
                            />
                        ) : (
                            <View style={[styles.fotoPet, styles.semFoto]}>
                                <Ionicons
                                    name="paw"
                                    size={30}
                                    color="#FA9F2A"
                                />
                            </View>
                        )}

                        <View style={styles.infoPet}>
                            <Text style={styles.nomePet}>
                                {pet?.nome || "Nenhum pet selecionado"}
                            </Text>

                            <Text style={styles.dadosPet}>
                                {pet
                                    ? `${pet.especie} • ${calcularIdadePet(pet)}`
                                    : "Escolha um pet na lista"}
                            </Text>
                        </View>

                        <Ionicons
                            name={aberto ? "chevron-up" : "chevron-down"}
                            size={26}
                            color="#332716"
                        />
                    </Pressable>

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

                        {pet ? (
                            editandoBio ? (
                                <View>
                                    <TextInput
                                        style={[styles.biografia, styles.campoBio]}
                                        value={bio}
                                        onChangeText={setBio}
                                        placeholder="Conte um pouco sobre seu pet..."
                                        placeholderTextColor="#8C8177"
                                        multiline
                                        maxLength={160}
                                    />

                                    <Pressable
                                        style={styles.publicar}
                                        onPress={salvarBio}
                                    >
                                        <Text style={styles.textoPublicar}>
                                            Salvar biografia
                                        </Text>
                                    </Pressable>
                                </View>
                            ) : (
                                <Pressable onPress={() => setEditandoBio(true)}>
                                    <Text style={styles.biografia}>
                                        {bio || "Toque para adicionar uma biografia."}
                                    </Text>

                                    <Text style={styles.editarBio}>
                                        Editar bio
                                    </Text>
                                </Pressable>
                            )
                        ) : (
                            <Text style={styles.biografia}>
                                Selecione um pet para visualizar o perfil.
                            </Text>
                        )}

                        {tutorPublico && (
                            <Pressable
                                style={styles.botaoTutorPublico}
                                onPress={() => setModalTutor(true)}
                            >
                                <Ionicons
                                    name="person-circle-outline"
                                    size={26}
                                    color="#80502D"
                                />

                                <Text style={styles.textoTutorPublico}>
                                    Conheça o tutor
                                </Text>

                                <Ionicons
                                    name="chevron-forward"
                                    size={19}
                                    color="#80502D"
                                />
                            </Pressable>
                        )}

                        <View style={styles.divisor} />

                        <Text style={styles.tituloSecao}>
                            Minhas publicações
                        </Text>

                        <View style={styles.fotosContainer}>
                            {fotosPet.length === 0 ? (
                                <Text style={styles.biografia}>
                                    Este pet ainda não possui publicações.
                                </Text>
                            ) : (
                                fotosPet.map((publicacao) => (
                                    <Image
                                        key={String(publicacao.id)}
                                        source={{ uri: publicacao.foto_uri }}
                                        style={styles.fotoPublicacao}
                                    />
                                ))
                            )}
                        </View>

                        <Pressable
                            style={styles.publicar}
                            onPress={onPublicar}
                            disabled={!pet || !onPublicar}
                        >
                            <Ionicons
                                name="add-circle-outline"
                                size={22}
                                color="#332716"
                            />

                            <Text style={styles.textoPublicar}>
                                {onPublicar ? "Nova publicação" : "Publicações em preparação"}
                            </Text>
                        </Pressable>

                    </ScrollView>
                )}

            </Animated.View>

            <Modal
                visible={modalTutor && !!tutorPublico}
                transparent
                animationType="fade"
                onRequestClose={() => setModalTutor(false)}
            >
                <View style={styles.fundoModalTutor}>

                    <Pressable
                        style={StyleSheet.absoluteFillObject}
                        onPress={() => setModalTutor(false)}
                    />

                    <View style={styles.cartaoTutorPublico}>

                        <Ionicons
                            name="person-circle"
                            size={75}
                            color="#80502D"
                        />

                        <Text style={styles.nomeTutorPublico}>
                            {tutorPublico?.nome}
                        </Text>

                        <Text style={styles.descricaoTutorPublico}>
                            Tutor de {pet?.nome}
                        </Text>

                        <Pressable
                            style={styles.fecharTutor}
                            onPress={() => setModalTutor(false)}
                        >
                            <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>
                                Fechar
                            </Text>
                        </Pressable>

                    </View>

                </View>
            </Modal>

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
        backgroundColor: "#FFF7EC",
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        overflow: "hidden",

        borderBottomWidth: 1,
        borderBottomColor: "#EADFCB",

        elevation: 5,
        shadowColor: "#332716",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.10,
        shadowRadius: 6,

        zIndex: 12,
    },

    cabecalho: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 6,
        paddingBottom: 8,
    },

    fotoPet: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },

    infoPet: {
        flex: 1,
        marginLeft: 12,
    },

    nomePet: {
        fontFamily: "Ruwudu-Bold",
        fontSize: 25,
        color: "#332716",
    },

    dadosPet: {
        fontFamily: "Ruwudu-Regular",
        fontSize: 20,
        color: "#75571F",
        marginTop: 1,
    },

    indicadorContainer: {
        alignItems: "center",
        paddingTop: 3,
    },

    indicador: {
        width: 38,
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
        flexWrap: "wrap",
        gap: 8,
        marginTop: 10,
        marginBottom: 25,
    },

    fotoPublicacao: {
        width: "31%",
        aspectRatio: 1,
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
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999,
        elevation: 20,
    },

    semFoto: {
        backgroundColor: "#FFFDF8",
        justifyContent: "center",
        alignItems: "center",
    },

    campoBio: {
        borderWidth: 1,
        borderColor: "#B89967",
        borderRadius: 12,
        padding: 12,
        minHeight: 85,
        textAlignVertical: "top",
        color: "#332716",
    },

    editarBio: {
        fontFamily: "Ruwudu-Bold",
        fontSize: 15,
        color: "#80502D",
        marginTop: 8,
    },


    botaoTutorPublico: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFEAC8',
        padding: 14,
        borderRadius: 15,
        marginTop: 15,
        gap: 10,
    },

    textoTutorPublico: {
        flex: 1,
        color: '#332716',
        fontSize: 16,
        fontWeight: 'bold',
    },

    fundoModalTutor: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 25,
    },

    cartaoTutorPublico: {
        backgroundColor: '#FFFDF8',
        borderRadius: 25,
        padding: 30,
        alignItems: 'center',
        width: '100%',
        maxWidth: 340,
    },

    nomeTutorPublico: {
        fontSize: 23,
        fontWeight: 'bold',
        color: '#332716',
        marginTop: 10,
    },

    descricaoTutorPublico: {
        fontSize: 15,
        color: '#75571F',
        marginTop: 5,
    },

    fecharTutor: {
        backgroundColor: '#80502D',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 22,
    },

});
