import React, { useRef, useState, useMemo, useEffect, useCallback } from "react";
import { View, Text, Image, Pressable, ScrollView, StyleSheet, Animated, PanResponder, useWindowDimensions, TextInput, Modal } from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSQLiteContext } from "expo-sqlite";
import {
    obterPerfilTutor,
    obterBioPublica,
    salvarBioPublica
} from "../database/Database";
import { useFocusEffect } from '@react-navigation/native';

import Botao from "./Botao";
import AvatarPet from "./AvatarPet";

// Paleta do Tutus usada neste painel
const COR = {
    fundo: "#FFFDF8",
    creme: "#FFEAC8",
    marrom: "#332716",
    laranja: "#FA9F2A",
    terracota: "#D18B5F",
    oliva: "#75571F",
};

// Altura do cartão fechado e distância até o topo.
// A Comunidade usa estes valores para o Feed começar logo abaixo do cartão.
export const ALTURA_FECHADA = 125;
export const MARGEM_TOPO = 0;

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
    onPublicar,
    deslocamento
}) {
    const db = useSQLiteContext();

    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const alturaExpandida = height * 0.75;

    // tamanho de cada foto da grade (3 por linha)
    const tamanhoFoto = Math.floor((width - 28 - 16 - 32 - 16) / 3);

    const [aberto, setAberto] = useState(false);
    const [mostrarFundo, setMostrarFundo] = useState(false);

    const [bio, setBio] = useState("");
    const [editandoBio, setEditandoBio] = useState(false);

    // guarda a última bio salva, para o botão "Cancelar" desfazer a edição
    const bioSalva = useRef("");


    const [tutorPublico, setTutorPublico] = useState(null);
    const [modalTutor, setModalTutor] = useState(false);

    useFocusEffect(
        useCallback(() => {
            let ativo = true;

            async function carregarTutor() {
                try {
                    const tutor = await obterPerfilTutor(db);

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
        }, [db])
    );


    useEffect(() => {
        let ativo = true;

        setBio("");
        bioSalva.current = "";
        setEditandoBio(false);

        async function carregarBio() {
            if (!pet?.id_pet) return;

            try {
                const salva = await obterBioPublica(db, pet.id_pet);

                if (ativo) {
                    setBio(salva || "");
                    bioSalva.current = salva || "";
                }
            } catch (erro) {
                console.error("Erro ao carregar bio:", erro);
            }
        }

        carregarBio();

        return () => {
            ativo = false;
        };
    }, [db, pet?.id_pet]);

    async function salvarBio() {
        if (!pet?.id_pet) return;

        try {
            await salvarBioPublica(db, pet.id_pet, bio.trim());

            setBio(bio.trim());
            bioSalva.current = bio.trim();
            setEditandoBio(false);

        } catch (erro) {
            console.error("Erro ao salvar bio:", erro);
        }
    }

    // desfaz a edição da bio
    function cancelarBio() {
        setBio(bioSalva.current);
        setEditandoBio(false);
    }

    // todas as publicações do pet (com ou sem foto)
    const publicacoesPet = publicacoes.filter(
        (publicacao) =>
            pet &&
            String(publicacao.id_pet) === String(pet.id_pet)
    );

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
        outputRange: [ALTURA_FECHADA + insets.top, alturaExpandida + insets.top],
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

            {/* cartão flutuante que cresce para baixo */}
            <Animated.View
                style={[
                    styles.painel,
                    {
                        height: alturaPainel,
                        top: 0,
                        paddingTop: insets.top,
                        transform: [{ translateY: aberto || !deslocamento ? 0 : deslocamento }],
                    }
                ]}
            >

                {/* patinha decorativa no canto */}
                <View style={styles.patinha} pointerEvents="none">
                    <Ionicons name="paw" size={84} color={COR.laranja} />
                </View>

                {/* parte que o usuário toca ou puxa */}
                <View {...gesto.panHandlers}>

                    <Pressable
                        style={styles.cabecalho}
                        onPress={aberto ? fecharPerfil : abrirPerfil}
                        accessibilityRole="button"
                        accessibilityLabel={
                            aberto
                                ? "Fechar perfil público"
                                : "Abrir perfil público"
                        }
                    >
                        <AvatarPet
                            foto={pet?.foto_perfil}
                            tamanho={80}
                            style={styles.fotoPet}
                        />

                        <View style={styles.infoPet}>
                            <Text
                                style={styles.rotulo}
                                numberOfLines={1}
                                maxFontSizeMultiplier={1.15}
                            >
                                PERFIL PÚBLICO
                            </Text>

                            <Text
                                style={styles.nomePet}
                                numberOfLines={1}
                                maxFontSizeMultiplier={1.15}
                            >
                                {pet?.nome || "Nenhum pet selecionado"}
                            </Text>

                            <Text
                                style={styles.dadosPet}
                                numberOfLines={1}
                                maxFontSizeMultiplier={1.15}
                            >
                                {pet
                                    ? `${pet.especie} • ${calcularIdadePet(pet)}`
                                    : "Escolha um pet na lista"}
                            </Text>
                        </View>

                    </Pressable>

                </View>

                {/* conteúdo visível quando expandido */}
                {aberto && (
                    <ScrollView
                        style={styles.perfilExpandido}
                        contentContainerStyle={styles.perfilConteudo}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >

                        {/* números do pet */}
                        <View style={styles.numeros}>
                            <View style={styles.numero}>
                                <Text style={styles.numeroValor}>
                                    {publicacoesPet.length}
                                </Text>
                                <Text style={styles.numeroLegenda}>
                                    {publicacoesPet.length === 1
                                        ? "publicação"
                                        : "publicações"}
                                </Text>
                            </View>

                            <View style={styles.numero}>
                                <Text style={styles.numeroValor}>
                                    {fotosPet.length}
                                </Text>
                                <Text style={styles.numeroLegenda}>
                                    {fotosPet.length === 1 ? "foto" : "fotos"}
                                </Text>
                            </View>
                        </View>

                        {/* biografia */}
                        <View style={styles.linhaTitulo}>
                            <Text style={styles.tituloSecao}>
                                Sobre
                            </Text>

                            {pet && !editandoBio && !!bio && (
                                <Pressable
                                    style={styles.botaoLapis}
                                    onPress={() => setEditandoBio(true)}
                                    accessibilityRole="button"
                                    accessibilityLabel="Editar biografia"
                                    hitSlop={8}
                                >
                                    <Ionicons
                                        name="pencil"
                                        size={16}
                                        color={COR.marrom}
                                    />
                                </Pressable>
                            )}
                        </View>

                        {pet ? (
                            editandoBio ? (
                                <View>
                                    <TextInput
                                        style={[styles.biografia, styles.campoBio]}
                                        value={bio}
                                        onChangeText={setBio}
                                        placeholder="Conte um pouco sobre seu pet..."
                                        placeholderTextColor="#A89A82"
                                        multiline
                                        maxLength={160}
                                        autoFocus
                                    />

                                    <Text style={styles.contador}>
                                        {bio.length}/160
                                    </Text>

                                    <View style={styles.linhaBotoes}>
                                        <Botao
                                            titulo="Cancelar"
                                            variante="contorno"
                                            onPress={cancelarBio}
                                            style={styles.botaoMetade}
                                        />

                                        <Botao
                                            titulo="Salvar"
                                            onPress={salvarBio}
                                            style={styles.botaoMetade}
                                        />
                                    </View>
                                </View>
                            ) : bio ? (
                                <Text style={styles.biografia}>
                                    {bio}
                                </Text>
                            ) : (
                                <Pressable
                                    style={styles.caixaVazia}
                                    onPress={() => setEditandoBio(true)}
                                    accessibilityRole="button"
                                >
                                    <Ionicons
                                        name="add-circle-outline"
                                        size={22}
                                        color={COR.terracota}
                                    />
                                    <Text style={styles.textoCaixaVazia}>
                                        Adicionar uma bio
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
                                <View style={styles.bolinhaTutor}>
                                    <Ionicons
                                        name="person"
                                        size={18}
                                        color={COR.marrom}
                                    />
                                </View>

                                <Text style={styles.textoTutorPublico}>
                                    Conheça o tutor
                                </Text>

                                <Ionicons
                                    name="chevron-forward"
                                    size={19}
                                    color={COR.marrom}
                                />
                            </Pressable>
                        )}

                        {/* fotos publicadas */}
                        <Text style={[styles.tituloSecao, styles.tituloFotos]}>
                            Fotos
                        </Text>

                        {fotosPet.length === 0 ? (
                            <View style={[styles.caixaVazia, styles.caixaFotos]}>
                                <Ionicons
                                    name="images-outline"
                                    size={26}
                                    color={COR.terracota}
                                />
                                <Text style={styles.textoCaixaVazia}>
                                    {pet
                                        ? "Este pet ainda não tem fotos publicadas."
                                        : "As fotos do pet aparecem aqui."}
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.fotosContainer}>
                                {fotosPet.map((publicacao) => (
                                    <Image
                                        key={String(publicacao.id)}
                                        source={{ uri: publicacao.foto_uri }}
                                        style={[styles.fotoPublicacao, { width: tamanhoFoto, height: tamanhoFoto }]}
                                    />
                                ))}
                            </View>
                        )}

                    </ScrollView>
                )}

                {/* barrinha para arrastar (fica embaixo, pois o cartão abre para baixo) */}
                <View
                    style={styles.indicadorContainer}
                    {...gesto.panHandlers}
                >
                    <View style={styles.indicador} />
                </View>

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

                        <View style={styles.avatarTutorPublico}>
                            <Ionicons
                                name="person"
                                size={38}
                                color={COR.marrom}
                            />
                        </View>

                        <Text style={styles.nomeTutorPublico}>
                            {tutorPublico?.nome}
                        </Text>

                        <Text style={styles.descricaoTutorPublico}>
                            Tutor de {pet?.nome}
                        </Text>

                        <Botao
                            titulo="Fechar"
                            onPress={() => setModalTutor(false)}
                            style={styles.fecharTutor}
                        />

                    </View>

                </View>
            </Modal>

        </View>
    );
}

const styles = StyleSheet.create({

    containerAba: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999,
        elevation: 20,
    },

    fundoEscuro: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(30, 23, 15, 0.55)",
    },

    // cartão flutuante
    painel: {
        position: "absolute",
        left: 0,
        right: 0,
        backgroundColor: COR.marrom,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        overflow: "hidden",

        elevation: 8,
        shadowColor: COR.marrom,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.14,
        shadowRadius: 12,

        zIndex: 12,
    },

    patinha: {
        position: "absolute",
        top: -8,
        right: 44,
        opacity: 0.12,
        transform: [{ rotate: "-18deg" }],
    },

    cabecalho: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 14,
        paddingTop: 14,
        paddingBottom: 6,
    },

    fotoPet: {
        borderWidth: 3,
        borderColor: COR.fundo,
        backgroundColor: COR.fundo,
    },

    infoPet: {
        flex: 1,
        minWidth: 0,
    },

    rotulo: {
        fontFamily: "Ruwudu-Bold",
        fontSize: 12,
        lineHeight: 16,
        letterSpacing: 1.5,
        color: COR.terracota,
        paddingBottom: 10,
    },

    nomePet: {
        fontFamily: "Ruwudu-Bold",
        fontSize: 26,
        lineHeight: 30,
        color: COR.creme,
        paddingBottom: 5,
    },

    dadosPet: {
        fontFamily: "Ruwudu-Regular",
        fontSize: 18,
        lineHeight: 23,
        color: 'rgba(255, 234, 200, 0.72)',
    },

    indicadorContainer: {
        height: 20,
        alignItems: "center",
        justifyContent: "center",
    },

    indicador: {
        width: 38,
        height: 4,
        borderRadius: 4,
        backgroundColor: COR.terracota,
        opacity: 0.55,
    },

    // parte de dentro (aparece ao abrir)
    perfilExpandido: {
        flex: 1,
        backgroundColor: COR.fundo,
        marginHorizontal: 8,
        marginTop: 8,
        borderRadius: 22,
    },

    perfilConteudo: {
        padding: 16,
        paddingBottom: 22,
    },

    numeros: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 18,
    },

    numero: {
        flex: 1,
        alignItems: "center",
        backgroundColor: '#FFFFFF',
        elevation: 3,
        borderRadius: 18,
        paddingVertical: 10,
    },

    numeroValor: {
        fontFamily: "Ruwudu-Bold",
        fontSize: 22,
        color: COR.marrom,
    },

    numeroLegenda: {
        fontFamily: "Ruwudu-Regular",
        fontSize: 14,
        color: COR.oliva,
    },

    linhaTitulo: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 6,
    },

    tituloSecao: {
        fontFamily: "Ruwudu-Bold",
        fontSize: 20,
        color: COR.marrom,
    },

    tituloFotos: {
        marginTop: 20,
        marginBottom: 10,
    },

    botaoLapis: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: COR.laranja,
        alignItems: "center",
        justifyContent: "center",
    },

    biografia: {
        fontFamily: "Ruwudu-Regular",
        fontSize: 16,
        lineHeight: 24,
        color: COR.oliva,
    },

    campoBio: {
        borderWidth: 1.5,
        borderColor: COR.laranja,
        backgroundColor: "#FFFFFF",
        borderRadius: 15,
        padding: 12,
        minHeight: 90,
        textAlignVertical: "top",
        color: COR.marrom,
    },

    contador: {
        fontFamily: "Ruwudu-Regular",
        fontSize: 13,
        color: COR.oliva,
        textAlign: "right",
        marginTop: 4,
    },

    linhaBotoes: {
        flexDirection: "row",
        gap: 10,
        marginTop: 8,
    },

    botaoMetade: {
        flex: 1,
        minWidth: 0,
        height: 46,
        marginTop: 0,
        paddingHorizontal: 10,
    },

    caixaVazia: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        borderWidth: 1.5,
        borderStyle: "dashed",
        borderColor: COR.terracota,
        borderRadius: 18,
        paddingVertical: 14,
        paddingHorizontal: 12,
    },

    caixaFotos: {
        flexDirection: "column",
        paddingVertical: 22,
    },

    textoCaixaVazia: {
        fontFamily: "Ruwudu-Regular",
        fontSize: 16,
        color: COR.oliva,
        textAlign: "center",
    },

    botaoTutorPublico: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        elevation: 3,
        padding: 10,
        borderRadius: 18,
        marginTop: 16,
        gap: 10,
    },

    bolinhaTutor: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: COR.laranja,
        alignItems: "center",
        justifyContent: "center",
    },

    textoTutorPublico: {
        flex: 1,
        fontFamily: "Ruwudu-Bold",
        fontSize: 17,
        color: COR.marrom,
    },

    fotosContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },

    fotoPublicacao: {
        borderRadius: 16,
        backgroundColor: 'rgba(51, 39, 22, 0.06)',
    },

    // janela "Conheça o tutor"
    fundoModalTutor: {
        flex: 1,
        backgroundColor: 'rgba(30, 23, 15, 0.55)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 25,
    },

    cartaoTutorPublico: {
        backgroundColor: COR.fundo,
        borderRadius: 28,
        padding: 28,
        alignItems: 'center',
        width: '100%',
        maxWidth: 340,
    },

    avatarTutorPublico: {
        width: 84,
        height: 84,
        borderRadius: 42,
        backgroundColor: COR.marrom,
        alignItems: "center",
        justifyContent: "center",
    },

    nomeTutorPublico: {
        fontFamily: "Ruwudu-Bold",
        fontSize: 24,
        color: COR.marrom,
        marginTop: 12,
        textAlign: "center",
    },

    descricaoTutorPublico: {
        fontFamily: "Ruwudu-Regular",
        fontSize: 16,
        color: COR.oliva,
        marginTop: 2,
    },

    fecharTutor: {
        marginTop: 20,
    },

});