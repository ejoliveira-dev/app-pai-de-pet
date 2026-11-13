import React, { useState, useCallback, useRef } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { buscarPet, obterPetSelecionadoId, listarPublicacoes, inserirPublicacao } from '../database/Database';
import { useFocusEffect } from '@react-navigation/native';

import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from "expo-image-picker";
import { File, Paths } from "expo-file-system";

import AbaPerfilPublico, { ALTURA_FECHADA, MARGEM_TOPO } from "../componentes/AbaPerfilPublico";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Cartao from "../componentes/Cartao";
import Botao from "../componentes/Botao";
import AvatarPet from "../componentes/AvatarPet";
import { cores, fontes, sombra } from "../styles/tema";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable, Image, Modal, TextInput, Animated, StatusBar, RefreshControl } from 'react-native';
import { Alert } from "../componentes/AlertaTutus";

// Ex.: "agora", "há 5 min", "há 2 h", "ontem", "12/11"
function tempoRelativo(texto) {
    const data = new Date(texto);
    const minutos = Math.floor((Date.now() - data.getTime()) / 60000);

    if (Number.isNaN(minutos)) return '';
    if (minutos < 1) return 'agora';
    if (minutos < 60) return `há ${minutos} min`;

    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `há ${horas} h`;
    if (horas < 48) return 'ontem';

    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export default function Comunidade() {
    const db = useSQLiteContext();
    const insets = useSafeAreaInsets();

    const [pet, setPet] = useState(null);
    const [publicacoes, setPublicacoes] = useState([]);
    const [modalAberto, setModalAberto] = useState(false);
    const [legenda, setLegenda] = useState("");
    const [foto, setFoto] = useState(null);
    const [salvando, setSalvando] = useState(false);
    const [curtidos, setCurtidos] = useState({});
    const [atualizando, setAtualizando] = useState(false);
    const [coracaoVisivel, setCoracaoVisivel] = useState(null);
    const ultimoToque = useRef({});
    const escalaCoracao = useRef(new Animated.Value(0)).current;
    
    // rolagem do feed: move a aba do perfil junto e decide quando mostrar o +
    const rolagem = useRef(new Animated.Value(0)).current;
    const [mostrarBotao, setMostrarBotao] = useState(false);

    const deslocamentoAba = rolagem.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -1],
        extrapolateLeft: 'clamp',
    });

    const aoRolar = Animated.event(
        [{ nativeEvent: { contentOffset: { y: rolagem } } }],
        {
            useNativeDriver: false,
            listener: (evento) => {
                // o + aparece quando a barra "O que ... está aprontando?" sai da tela
                setMostrarBotao(evento.nativeEvent.contentOffset.y > ALTURA_FECHADA + 70);
            },
        }
    );

    useFocusEffect(
        useCallback(() => {
            StatusBar.setBarStyle('light-content');
            return () => StatusBar.setBarStyle('dark-content');
        }, [])
    );

    useFocusEffect(
        useCallback(() => {
            let ativo = true;

            async function carregarPet() {
                try {
                    const id = await obterPetSelecionadoId(db);

                    const encontrado = id ? await buscarPet(db, id) : null;

                    const listaPosts = await listarPublicacoes(db);

                    if (ativo) {
                        setPet(encontrado);
                        setPublicacoes(listaPosts);
                    }

                } catch (erro) {
                    console.error(
                        'Erro ao carregar pet público:',
                        erro
                    );

                    if (ativo) setPet(null);
                }
            }

            carregarPet();

            return () => {
                ativo = false;
            };

        }, [db])
    );

    // abre o formulário de publicação
    function abrirPublicacao() {
        if (!pet) {
            Alert.alert(
                "Selecione um pet",
                "Escolha um pet antes de publicar."
            );
            return;
        }

        setModalAberto(true);
    }

    // fecha o formulário
    function fecharPublicacao() {
        if (salvando) return;

        setModalAberto(false);
        setLegenda("");
        setFoto(null);
    }

    // seleciona uma fotografia
    async function selecionarFoto() {
        try {
            const resultado = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ["images"],
                allowsEditing: false,
                quality: 0.8,
            });

            if (!resultado.canceled && resultado.assets?.length) {
                setFoto(resultado.assets[0].uri);
            }
        } catch (erro) {
            console.error("Erro ao selecionar foto:", erro);
            Alert.alert("Erro", "Não foi possível selecionar a foto.");
        }
    }

    // salva a publicação
    async function publicar() {
        if (salvando || !pet) return;

        if (!legenda.trim() && !foto) {
            Alert.alert(
                "Publicação vazia",
                "Escreva uma legenda ou escolha uma foto."
            );
            return;
        }

        setSalvando(true);

        try {
            let fotoSalva = null;

            if (foto) {
                const extensao =
                    foto.match(/\.(jpg|jpeg|png|webp|heic)(?:\?.*)?$/i)?.[1]
                    || "jpg";

                const origem = new File(foto);

                const destino = new File(
                    Paths.document,
                    `tutus-post-${Date.now()}.${extensao}`
                );

                await origem.copy(destino);
                fotoSalva = destino.uri;
            }

            const novaPublicacao = {
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                id_pet: pet.id_pet,
                nome_pet: pet.nome,
                foto_pet: pet.foto_perfil || null,
                foto_uri: fotoSalva,
                legenda: legenda.trim(),
                criado_em: new Date().toISOString(),
            };

            const listaAtualizada = [
                novaPublicacao,
                ...publicacoes
            ];

            await inserirPublicacao(db, novaPublicacao);

            setPublicacoes(listaAtualizada);
            setLegenda("");
            setFoto(null);
            setModalAberto(false);

        } catch (erro) {
            console.error("Erro ao publicar:", erro);
            Alert.alert(
                "Erro",
                "Não foi possível salvar a publicação."
            );
        } finally {
            setSalvando(false);
        }
    }

    // primeiro nome do pet para a barra de publicar
    const primeiroNome = pet?.nome?.split(' ')[0] || 'seu pet';

    // curtir/descurtir
    function alternarCurtida(id) {
        setCurtidos((atual) => ({ ...atual, [id]: !atual[id] }));
    }
    
    // toque duplo na foto curte o post (igual ao Insta)
    function tocarFoto(id) {
        const agora = Date.now();

        if (agora - (ultimoToque.current[id] || 0) < 300) {
            setCurtidos((atual) => ({ ...atual, [id]: true }));
            setCoracaoVisivel(id);
            escalaCoracao.setValue(0);
            Animated.sequence([
                Animated.spring(escalaCoracao, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }),
                Animated.delay(250),
                Animated.timing(escalaCoracao, { toValue: 0, duration: 200, useNativeDriver: true }),
            ]).start(() => setCoracaoVisivel(null));
        }

        ultimoToque.current[id] = agora;
    }

    // puxar para atualizar o feed
    async function atualizarFeed() {
        setAtualizando(true);

        try {
            const lista = await listarPublicacoes(db);
            setPublicacoes(lista);
        } catch (erro) {
            console.error("Erro ao atualizar feed:", erro);
            Alert.alert("Ops!", "Não foi possível atualizar o feed.");
        } finally {
            setAtualizando(false);
        }
    }

    return (
        <View style={styles.container}>

            <Animated.ScrollView
                style={{ flex: 1 }}
                onScroll={aoRolar}
                scrollEventThrottle={16}
                refreshControl={
                    <RefreshControl
                        refreshing={atualizando}
                        onRefresh={atualizarFeed}
                        colors={[cores.laranja]}
                        tintColor={cores.laranja}
                        progressViewOffset={insets.top + ALTURA_FECHADA}
                    />
                }
                contentContainerStyle={[
                    styles.conteudo,
                    { paddingTop: insets.top + MARGEM_TOPO + ALTURA_FECHADA + 18 }
                ]}
                showsVerticalScrollIndicator={false}
            >
                {/* feed */}
                <Pressable
                    onPress={abrirPublicacao}
                    style={({ pressed }) => [styles.compor, pressed && styles.pressionado]}
                >
                    <AvatarPet foto={pet?.foto_perfil} tamanho={40} />
                    <Text style={styles.comporTexto} numberOfLines={1}>
                        O que {primeiroNome} está aprontando?
                    </Text>
                    <View style={styles.comporFoto}>
                        <Ionicons name="image-outline" size={18} color={cores.marrom} />
                    </View>
                </Pressable>

                <Text style={styles.tituloFeed}>Feed</Text>

                {/* publicações cadastradas */}
                {publicacoes.length === 0 ? (
                    <View style={styles.vazio}>
                        <Text style={styles.textoVazio}>
                            Nenhuma publicação ainda.{'\n'}Toque no + para criar a primeira!
                        </Text>
                    </View>
                ) : (
                    publicacoes.map((post) => (
                        <View
                            key={String(post.id)}
                            style={styles.cardPublicacao}
                        >

                            <View style={styles.cabecalhoPost}>
                                <View style={styles.anelAvatar}>
                                    <AvatarPet foto={post.foto_pet} tamanho={38} />
                                </View>

                                <View style={styles.infoPost}>
                                    <Text style={styles.autorPost} numberOfLines={1}>
                                        {post.nome_pet}
                                    </Text>
                                    <Text style={styles.dataPost}>
                                        {tempoRelativo(post.criado_em)}
                                    </Text>
                                </View>
                            </View>

                            {post.foto_uri ? (
                                <Pressable onPress={() => tocarFoto(post.id)}>
                                    <Image
                                        source={{ uri: post.foto_uri }}
                                        style={styles.imagemPost}
                                        resizeMode="cover"
                                    />

                                    {coracaoVisivel === post.id && (
                                                                                             <Animated.View
                                            style={[styles.coracaoGrande, { opacity: escalaCoracao, transform: [{ scale: escalaCoracao }] }]}
                                            pointerEvents="none"
                                        >
                                            <Ionicons name="heart" size={110} color={cores.laranja} style={styles.sombraCoracao} />
                                        </Animated.View>
                                    )}
                                </Pressable>
                            ) : null}

                            {!!post.legenda && (
                                <Text style={styles.legendaPost}>
                                    <Text style={styles.legendaNome}>{post.nome_pet} </Text>
                                    {post.legenda}
                                </Text>
                            )}

                            <View style={styles.acoesPost}>
                                <Pressable
                                    onPress={() => alternarCurtida(post.id)}
                                    hitSlop={10}
                                    accessibilityRole="button"
                                    accessibilityLabel="Curtir"
                                    style={({ pressed }) => pressed && styles.pressionado}
                                >
                                    <Ionicons
                                        name={curtidos[post.id] ? 'heart' : 'heart-outline'}
                                        size={26}
                                        color={curtidos[post.id] ? cores.laranja : cores.marrom}
                                    />
                                </Pressable>

                                {curtidos[post.id] && (
                                    <Text style={styles.textoCurtida}>Você curtiu</Text>
                                )}
                            </View>

                        </View>
                    ))
                )}

            </Animated.ScrollView>

            {/* botão flutuante de publicar */}
            {mostrarBotao && (
                <TouchableOpacity
                    style={styles.botaoFlutuante}
                    onPress={abrirPublicacao}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel="Nova publicação"
                >
                    <Ionicons name="add" size={32} color="#332716" />

                </TouchableOpacity>
            )}

            <AbaPerfilPublico
                pet={pet}
                publicacoes={publicacoes}
                onPublicar={abrirPublicacao}
                deslocamento={deslocamentoAba}
            />

            {/* faixa marrom fixa atrás da barra de status */}
            <View style={[styles.faixaStatus, { height: insets.top }]} />

            <Modal
                visible={modalAberto}
                animationType="slide"
                transparent
                onRequestClose={fecharPublicacao}
            >
                <View style={styles.modalFundo}>

                    {/* tocar fora fecha */}
                    <Pressable style={StyleSheet.absoluteFillObject} onPress={fecharPublicacao} />

                    <View style={styles.modalConteudo}>

                        <View style={styles.puxador} />

                        <View style={styles.topoModal}>
                            <View style={styles.autorModal}>
                                <AvatarPet foto={pet?.foto_perfil} tamanho={42} />
                                <View>
                                    <Text style={styles.autorPost}>Nova publicação</Text>
                                    <Text style={styles.dataPost}>como {pet?.nome}</Text>
                                </View>
                            </View>

                            <Pressable
                                onPress={fecharPublicacao}
                                disabled={salvando}
                                hitSlop={8}
                                accessibilityRole="button"
                                accessibilityLabel="Cancelar"
                                style={styles.fechar}
                            >
                                <Ionicons name="close" size={20} color={cores.marrom} />
                            </Pressable>
                        </View>

                        <TextInput
                            style={styles.campoLegenda}
                            placeholder="O que seu pet está aprontando?"
                            placeholderTextColor="#A89A82"
                            value={legenda}
                            onChangeText={setLegenda}
                            multiline
                            maxLength={500}
                        />

                        <Text style={styles.contador}>{legenda.length}/500</Text>

                        {/* área da foto: toque para escolher */}
                        <Pressable
                            onPress={selecionarFoto}
                            disabled={salvando}
                            accessibilityRole="button"
                            style={({ pressed }) => [styles.escolherFoto, pressed && styles.pressionado]}
                        >
                            {foto ? (
                                <>
                                    <Image
                                        source={{ uri: foto }}
                                        style={styles.previaFoto}
                                        resizeMode="cover"
                                    />
                                    <View style={styles.trocarFoto}>
                                        <Ionicons name="image-outline" size={14} color={cores.laranjaClaro} />
                                        <Text style={styles.textoTrocarFoto}>Trocar</Text>
                                    </View>
                                </>
                            ) : (
                                <>
                                    <Ionicons name="image-outline" size={30} color={cores.laranja} />
                                    <Text style={styles.textoEscolherFoto}>Adicionar foto</Text>
                                </>
                            )}
                        </Pressable>

                        <Botao
                            titulo="Publicar"
                            larga
                            carregando={salvando}
                            onPress={publicar}
                            style={styles.botaoModal}
                        />

                    </View>
                </View>
            </Modal>

        </View>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: cores.fundo,
    },

    conteudo: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },

    tituloFeed: {
        fontFamily: fontes.negrito,
        fontSize: 24,
        lineHeight: 32,
        color: cores.marrom,
        marginBottom: 10,
    },


    vazio: {
        alignItems: 'center',
        backgroundColor: cores.branco,
        borderRadius: 25,
        paddingVertical: 28,
        paddingHorizontal: 20,
        ...sombra,
    },

    textoVazio: {
        fontFamily: fontes.regular,
        fontSize: 16,
        lineHeight: 23,
        color: cores.marromClaro,
        textAlign: 'center',
        marginTop: 12,
    },

    cardPublicacao: {
        backgroundColor: cores.branco,
        borderRadius: 25,
        overflow: 'hidden',
        marginBottom: 18,
        ...sombra,
    },

    cabecalhoPost: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },

    imagemPost: {
        width: '100%',
        aspectRatio: 4 / 5,
        backgroundColor: 'rgba(51, 39, 22, 0.06)',
    },

    legendaPost: {
        fontFamily: fontes.regular,
        fontSize: 16,
        lineHeight: 23,
        color: cores.marrom,
        paddingHorizontal: 14,
        paddingTop: 10,
    },

    autorPost: {
        fontFamily: fontes.negrito,
        fontSize: 17,
        lineHeight: 23,
        color: cores.marrom,
    },

    infoPost: {
        flex: 1,
        minWidth: 0,
    },

    dataPost: {
        fontFamily: fontes.regular,
        fontSize: 13,
        lineHeight: 18,
        color: cores.marromClaro,
    },

    legendaNome: {
        fontFamily: fontes.negrito,
    },

    botaoFlutuante: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 62,
        height: 62,
        borderRadius: 31,
        backgroundColor: cores.laranja,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 6,
        shadowColor: cores.marrom,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
    },

    modalFundo: {
        flex: 1,
        backgroundColor: 'rgba(30, 23, 15, 0.55)',
        justifyContent: 'flex-end',
    },

    modalConteudo: {
        backgroundColor: cores.fundo,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 20,
        paddingBottom: 30,
        gap: 12,
    },

    puxador: {
        alignSelf: 'center',
        width: 42,
        height: 5,
        borderRadius: 3,
        backgroundColor: 'rgba(51, 39, 22, 0.15)',
    },

    topoModal: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    autorModal: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },

    campoLegenda: {
        borderWidth: 1.5,
        borderColor: cores.laranja,
        backgroundColor: cores.branco,
        borderRadius: 18,
        padding: 12,
        minHeight: 100,
        textAlignVertical: 'top',
        fontFamily: fontes.regular,
        fontSize: 16,
        color: cores.marrom,
    },

    contador: {
        fontFamily: fontes.regular,
        fontSize: 12,
        color: cores.marromClaro,
        textAlign: 'right',
        marginTop: -6,
    },

    escolherFoto: {
        height: 140,
        borderRadius: 20,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: cores.laranja,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        overflow: 'hidden',
    },

    previaFoto: {
        width: '100%',
        height: '100%',
    },

    trocarFoto: {
        position: 'absolute',
        right: 10,
        bottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: cores.marrom,
        borderRadius: 16,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },

    textoTrocarFoto: {
        fontFamily: fontes.negrito,
        fontSize: 13,
        color: cores.laranjaClaro,
    },

    textoEscolherFoto: {
        fontFamily: fontes.negrito,
        fontSize: 15,
        color: cores.marromClaro,
    },

    botaoModal: {
        marginTop: 0,
    },

    fechar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(51, 39, 22, 0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // barra "O que ... está aprontando?"
    compor: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: cores.branco,
        borderRadius: 25,
        padding: 10,
        marginBottom: 22,
        ...sombra,
    },

    comporTexto: {
        flex: 1,
        fontFamily: fontes.regular,
        fontSize: 16,
        color: cores.marromClaro,
    },

    comporFoto: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: cores.laranja,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // anel laranja em volta do avatar do post
    anelAvatar: {
        padding: 2,
        borderRadius: 26,
        borderWidth: 2,
        borderColor: cores.laranja,
    },

    // linha do coração
    acoesPost: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 14,
        paddingTop: 10,
        paddingBottom: 14,
    },

    textoCurtida: {
        fontFamily: fontes.regular,
        fontSize: 14,
        color: cores.marromClaro,
    },

    coracaoGrande: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        elevation: 10,
    },

    sombraCoracao: {
        textShadowColor: 'rgba(0, 0, 0, 0.35)',
        textShadowOffset: { width: 0, height: 3 },
        textShadowRadius: 10,
    },

    faixaStatus: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: cores.marrom,
        zIndex: 1000,
        elevation: 21,
    },

    pressionado: {
        opacity: 0.7,
        transform: [{ scale: 0.97 }],
    },
});