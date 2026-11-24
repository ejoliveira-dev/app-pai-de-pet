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
import DecoracaoPerfil from "./DecoracaoPerfil/DecoracaoPerfil";

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
export const ALTURA_FECHADA = 185;
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
    deslocamento,
    carregando = false,
    perfilExterno = false,
    onVoltarPerfil,
    podeVoltar = false,
    idTutorAtual,
    pedidoAbrir = 0,
    onFechar
}) {
    const db = useSQLiteContext();

    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const alturaExpandida = height * 0.75;

    // tamanho de cada foto da grade (3 por linha)
    const tamanhoFoto = Math.floor((width - 16 - 32 - 8) / 3);

    const [aberto, setAberto] = useState(false);
    const [mostrarFundo, setMostrarFundo] = useState(false);

    const [bio, setBio] = useState("");
    const [editandoBio, setEditandoBio] = useState(false);

    // guarda a última bio salva, para o botão "Cancelar" desfazer a edição
    const bioSalva = useRef("");

    const [tutorPublico, setTutorPublico] = useState(null);
    const [modalTutor, setModalTutor] = useState(false);
    const [fotoAberta, setFotoAberta] = useState(null);

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
            if (!pet?.id_pet || perfilExterno) return;

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
    }, [db, pet?.id_pet, perfilExterno]);

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

    // e-mail do tutor do pet mostrado 
    const tutorDoPet = pet?.id_tutor || idTutorAtual;

    // todas as publicações do pet (com ou sem foto)
    const publicacoesPet = publicacoes.filter(
        (publicacao) =>
            pet &&
            String(publicacao.id_pet) === String(pet.id_pet) &&
            (!tutorDoPet || publicacao.id_tutor === tutorDoPet)
    );

    const fotosPet = publicacoes.filter(
        (publicacao) =>
            pet &&
            String(publicacao.id_pet) === String(pet.id_pet) &&
            (!tutorDoPet || publicacao.id_tutor === tutorDoPet)
    );

    function enderecoFoto(publicacao) {
        return publicacao.imagem_id
            ? `https://app-pai-de-pet.onrender.com/imagens/${publicacao.imagem_id}`
            : publicacao.foto_uri;
    }

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
                onFechar?.();
            }
        });
    }

    useEffect(() => {
        if (pedidoAbrir > 0) {
            abrirPerfil();
        }
    }, [pedidoAbrir]);

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
                        style={StyleSheet.absoluteFill}
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
                {/* botão de voltar, só aparece quando o perfil é aberto a partir de outro perfil */}
                {podeVoltar && (
                    <Pressable
                        style={[styles.voltarPet, { top: insets.top + 14 }]}
                        onPress={onVoltarPerfil}
                        accessibilityRole="button"
                        accessibilityLabel="Voltar ao perfil anterior"
                        hitSlop={8}
                    >
                        <Ionicons name="arrow-back" size={22} color={COR.creme} />
                    </Pressable>
                )}

                {/* parte que o usuário toca ou puxa */}
                <View {...gesto.panHandlers} style={styles.areaCabecalho}>

                    <DecoracaoPerfil especie={pet?.especie} />

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
                            tamanho={70}
                            style={styles.fotoPet}
                        />

                        <View style={styles.infoPet}>

                            <Text
                                style={styles.nomePet}
                                numberOfLines={1}
                                maxFontSizeMultiplier={1.15}
                            >
                                {pet?.nome || (carregando ? "Carregando..." : "Nenhum pet selecionado")}
                            </Text>

                            <View style={styles.capsulaDados}>
                                <Text
                                    style={styles.dadosPet}
                                    numberOfLines={1}
                                    maxFontSizeMultiplier={1.15}
                                >
                                    {pet
                                        ? pet.especie
                                            ? `${pet.especie} • ${calcularIdadePet(pet)}`
                                            : "Pet da comunidade"
                                        : "Escolha um pet na lista"}
                                </Text>
                            </View>

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
                                    {fotosPet.length === 1 ? "mídia" : "mídias"}
                                </Text>
                            </View>
                        </View>

                        {/* biografia */}
                        <View style={styles.linhaTitulo}>
                            <Text style={styles.tituloSecao}>
                                Sobre
                            </Text>

                            {pet && !perfilExterno && !editandoBio && !!bio && (
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
                                        <Pressable
                                            onPress={cancelarBio}
                                            style={({ pressed }) => [styles.botaoPequeno, styles.botaoPequenoContorno, pressed && { opacity: 0.6 }]}
                                        >
                                            <Text style={styles.textoBotaoPequeno}>Cancelar</Text>
                                        </Pressable>

                                        <Pressable
                                            onPress={salvarBio}
                                            style={({ pressed }) => [styles.botaoPequeno, pressed && { opacity: 0.6 }]}
                                        >
                                            <Text style={[styles.textoBotaoPequeno, { color: COR.fundo }]}>Salvar</Text>
                                        </Pressable>
                                    </View>
                                </View>
                            ) : bio ? (
                                <Text style={styles.biografia}>
                                    {bio}
                                </Text>
                            ) : perfilExterno ? (
                                <Text style={styles.biografia}>
                                    ...
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

                        {tutorPublico && !perfilExterno && (
                            <Pressable
                                style={({ pressed }) => [styles.botaoTutorPublico, pressed && { opacity: 0.6 }]}
                                onPress={() => setModalTutor(true)}
                                accessibilityRole="button"
                                accessibilityLabel={`Tutor: ${tutorPublico.nome}`}
                            >
                                <View style={styles.bolinhaTutor}>
                                    <Ionicons name="person" size={16} color={COR.laranja} />
                                </View>

                                <Text style={styles.textoTutorPublico} numberOfLines={1}>
                                    Tutor:{" "}
                                    <Text style={styles.nomeTutorDestaque}>
                                        {tutorPublico.nome.trim().split(" ")[0]}
                                    </Text>
                                </Text>
                            </Pressable>
                        )}

                        {/* fotos publicadas */}
                        <View style={styles.divisorMidia}>
                            <View style={styles.linhaTracejada} />
                            <Ionicons name="grid-outline" size={16} color={COR.terracota} />
                            <View style={styles.linhaTracejada} />
                        </View>

                        {fotosPet.length === 0 ? (
                            <View style={[styles.caixaVazia, styles.caixaFotos]}>
                                <Ionicons
                                    name="images-outline"
                                    size={26}
                                    color={COR.terracota}
                                />
                                <Text style={styles.textoCaixaVazia}>
                                    {pet
                                        ? "Este pet ainda não publicou nenhuma mídia."
                                        : "As mídias do pet aparecem aqui."}
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.fotosContainer}>
                                {fotosPet.map((publicacao) => (
                                    <Pressable
                                        key={String(publicacao.id)}
                                        onPress={() => setFotoAberta(publicacao)}
                                    >
                                        <Image
                                            source={{ uri: enderecoFoto(publicacao) }}
                                            style={[styles.fotoPublicacao, { width: tamanhoFoto, height: tamanhoFoto }]}
                                        />
                                    </Pressable>
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
                        style={StyleSheet.absoluteFill}
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

            <Modal
                visible={!!fotoAberta}
                transparent
                animationType="fade"
                statusBarTranslucent
                onRequestClose={() => setFotoAberta(null)}
            >
                <Pressable style={styles.fundoFoto} onPress={() => setFotoAberta(null)}>
                    <Image
                        source={{ uri: fotoAberta ? enderecoFoto(fotoAberta) : undefined }}
                        style={styles.fotoGrande}
                        resizeMode="contain"
                    />

                    {!!fotoAberta?.legenda && (
                        <Text style={styles.legendaFoto} numberOfLines={3}>
                            {fotoAberta.legenda}
                        </Text>
                    )}

                    <View style={[styles.fecharFoto, { top: insets.top + 12 }]}>
                        <Ionicons name="close" size={24} color={COR.fundo} />
                    </View>
                </Pressable>
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
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
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

    areaCabecalho: {
        position: "relative",
        height: ALTURA_FECHADA - 20,
        flexShrink: 0,
    },

    cabecalho: {
        flex: 1,
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 4,
        zIndex: 2,
    },

    fotoPet: {
        borderWidth: 3,
        borderColor: COR.fundo,
        backgroundColor: COR.fundo,
    },

    infoPet: {
        alignItems: "center",
        width: "100%",
    },

    rotulo: {
        fontFamily: "Ruwudu-Bold",
        fontSize: 10,
        lineHeight: 12,
        letterSpacing: 1.5,
        color: COR.terracota,
    },

    nomePet: {
        fontFamily: "Ruwudu-Bold",
        fontSize: 30,
        lineHeight: 36,
        color: COR.creme,
        textAlign: "center",
    },

    capsulaDados: {
        backgroundColor: "rgba(250, 159, 42, 0.15)",
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 2,
        maxWidth: "100%",
        alignItems: "center",
        justifyContent: "center",
    },

    dadosPet: {
        fontFamily: "Ruwudu-Regular",
        fontSize: 14,
        lineHeight: 22,
        color: "#E8C898",
        textAlign: "center",
    },

    indicadorContainer: {
        height: 20,
        flexShrink: 0,
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
        gap: 32,
        marginBottom: 14,
    },

    numero: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },

    numeroValor: {
        fontFamily: "Ruwudu-Bold",
        fontSize: 24,
        lineHeight: 30,
        color: COR.marrom,
    },

    numeroLegenda: {
        fontFamily: "Ruwudu-Regular",
        fontSize: 15,
        color: COR.oliva,
        textAlign: "center",
    },

    linhaTitulo: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 8,
    },

    tituloSecao: {
        fontFamily: "Ruwudu-Bold",
        fontSize: 21,
        color: COR.marrom,
    },

    botaoLapis: {
        padding: 4,
    },

    biografia: {
        fontFamily: "Ruwudu-Regular",
        fontSize: 16,
        lineHeight: 22,
        color: COR.marrom,
    },

    campoBio: {
        minHeight: 80,
        borderWidth: 1,
        borderColor: COR.terracota,
        borderRadius: 14,
        padding: 10,
        textAlignVertical: "top",
    },

    contador: {
        fontFamily: "Ruwudu-Regular",
        fontSize: 12,
        color: COR.oliva,
        textAlign: "right",
        marginTop: 4,
    },

    linhaBotoes: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 8,
        marginTop: 8,
    },

    botaoPequeno: {
        backgroundColor: COR.marrom,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 6,
    },

    botaoPequenoContorno: {
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: COR.marrom,
    },

    textoBotaoPequeno: {
        fontFamily: "Ruwudu-Bold",
        fontSize: 14,
        color: COR.marrom,
    },

    caixaVazia: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor: COR.terracota,
        borderRadius: 14,
        padding: 14,
    },

    textoCaixaVazia: {
        fontFamily: "Ruwudu-Regular",
        fontSize: 15,
        color: COR.oliva,
        textAlign: "center",
    },

    botaoTutorPublico: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 14,
    },

    bolinhaTutor: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: COR.creme,
        alignItems: "center",
        justifyContent: "center",
    },

    textoTutorPublico: {
        fontFamily: "Ruwudu-Regular",
        fontSize: 15,
        color: COR.marrom,
        flex: 1,
    },

    nomeTutorDestaque: {
        fontFamily: "Ruwudu-Bold",
        color: COR.marrom,
    },

    divisorMidia: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginVertical: 18,
    },

    linhaTracejada: {
        flex: 1,
        height: 1,
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor: COR.terracota,
        opacity: 0.5,
    },

    caixaFotos: {
        flexDirection: "column",
        minHeight: 100,
    },

    fotosContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 4,
    },

    fotoPublicacao: {
        borderRadius: 8,
        backgroundColor: COR.creme,
    },

    fundoModalTutor: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
    },

    cartaoTutorPublico: {
        width: "100%",
        maxWidth: 340,
        backgroundColor: COR.fundo,
        borderRadius: 24,
        padding: 24,
        alignItems: "center",
    },

    avatarTutorPublico: {
        width: 78,
        height: 78,
        borderRadius: 39,
        backgroundColor: COR.creme,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 10,
    },

    nomeTutorPublico: {
        fontFamily: "Ruwudu-Bold",
        fontSize: 24,
        color: COR.marrom,
        textAlign: "center",
    },

    descricaoTutorPublico: {
        fontFamily: "Ruwudu-Regular",
        fontSize: 16,
        color: COR.oliva,
        textAlign: "center",
        marginBottom: 18,
    },

    fecharTutor: {
        width: "100%",
    },

    fundoFoto: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.95)",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
    },

    fotoGrande: {
        width: "100%",
        height: "75%",
    },

    legendaFoto: {
        fontFamily: "Ruwudu-Regular",
        fontSize: 16,
        color: COR.fundo,
        textAlign: "center",
        marginTop: 12,
    },

    fecharFoto: {
        position: "absolute",
        right: 16,
        padding: 8,
    },

    voltarPet: {
        position: "absolute",
        right: 14,
        zIndex: 30,
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: "rgba(255, 253, 248, 0.18)",
        alignItems: "center",
        justifyContent: "center",
    },

});