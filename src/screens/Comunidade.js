import React, { useState, useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { buscarPet, obterPetSelecionadoId, listarPublicacoes, inserirPublicacao } from '../database/Database';
import { useFocusEffect } from '@react-navigation/native';

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Modal, TextInput } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from "expo-image-picker";
import { File, Paths } from "expo-file-system";

import AbaPerfilPublico, { ALTURA_FECHADA, MARGEM_TOPO } from "../componentes/AbaPerfilPublico";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Cartao from "../componentes/Cartao";
import Botao from "../componentes/Botao";
import AvatarPet from "../componentes/AvatarPet";
import { cores, fontes } from "../styles/tema";

export default function Comunidade() {
    const db = useSQLiteContext();
    const insets = useSafeAreaInsets();

    const [pet, setPet] = useState(null);
    const [publicacoes, setPublicacoes] = useState([]);
    const [modalAberto, setModalAberto] = useState(false);
    const [legenda, setLegenda] = useState("");
    const [foto, setFoto] = useState(null);
    const [salvando, setSalvando] = useState(false);

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

            Alert.alert(
                "Sucesso",
                "Publicação criada!"
            );

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

    return (
        <View style={styles.container}>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={[
                    styles.conteudo,
                    { paddingTop: insets.top + MARGEM_TOPO + ALTURA_FECHADA + 18 }
                ]}
                showsVerticalScrollIndicator={false}
            >
                {/* feed */}
                <View style={styles.linhaFeed}>
                    <Text style={styles.tituloFeed}>
                        Feed
                    </Text>
                </View>

                {/* publicações cadastradas */}
                {publicacoes.length === 0 ? (
                    <Cartao style={styles.vazio}>
                        <View style={styles.bolinhaVazio}>
                            <Ionicons name="images-outline" size={26} color={cores.marrom} />
                        </View>
                        <Text style={styles.textoVazio}>
                            Nenhuma publicação ainda. Que tal criar a primeira? 🐾
                        </Text>
                    </Cartao>
                ) : (
                    publicacoes.map((post) => (
                        <Cartao
                            key={String(post.id)}
                            style={styles.cardPublicacao}
                        >

                            <View style={styles.cabecalhoPost}>

                                <AvatarPet
                                    foto={post.foto_pet}
                                    tamanho={50}
                                    style={styles.fotoPost}
                                />

                                <View style={styles.infoPost}>
                                    <Text style={styles.autorPost}>
                                        {post.nome_pet}
                                    </Text>

                                    <Text style={styles.dataPost}>
                                        {new Date(post.criado_em)
                                            .toLocaleDateString("pt-BR")}
                                    </Text>
                                </View>

                            </View>

                            {post.foto_uri ? (
                                <Image
                                    source={{ uri: post.foto_uri }}
                                    style={styles.imagemPost}
                                    resizeMode="cover"
                                />
                            ) : null}

                            {!!post.legenda && (
                                <Text style={styles.legendaPost}>
                                    {post.legenda}
                                </Text>
                            )}

                        </Cartao>
                    ))
                )}

            </ScrollView>

            {/* botão flutuante de publicar */}
            <TouchableOpacity
                style={styles.botaoFlutuante}
                onPress={abrirPublicacao}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Nova publicação"
            >
                <Ionicons name="add" size={32} color="#332716" />

            </TouchableOpacity>

            <AbaPerfilPublico
                pet={pet}
                publicacoes={publicacoes}
                onPublicar={abrirPublicacao}
            />

            <Modal
                visible={modalAberto}
                animationType="slide"
                transparent
                onRequestClose={fecharPublicacao}
            >
                <View style={styles.modalFundo}>
                    <View style={styles.modalConteudo}>

                        <Text style={styles.tituloFeed}>
                            Nova publicação
                        </Text>

                        <Text style={styles.legendaPost}>
                            Publicando como: {pet?.nome}
                        </Text>

                        <TextInput
                            style={styles.campoLegenda}
                            placeholder="O que seu pet está aprontando?"
                            placeholderTextColor="#8C8177"
                            value={legenda}
                            onChangeText={setLegenda}
                            multiline
                            maxLength={500}
                        />

                        <Botao
                            titulo={foto ? "Trocar foto" : "Escolher foto"}
                            icone="image-outline"
                            variante="contorno"
                            larga
                            onPress={selecionarFoto}
                            desabilitado={salvando}
                            style={styles.botaoModal}
                        />

                        {foto && (
                            <Image
                                source={{ uri: foto }}
                                style={styles.imagemPost}
                                resizeMode="cover"
                            />
                        )}

                        <Botao
                            titulo="Publicar"
                            larga
                            carregando={salvando}
                            onPress={publicar}
                            style={styles.botaoModal}
                        />

                        <TouchableOpacity
                            onPress={fecharPublicacao}
                            disabled={salvando}
                        >
                            <Text style={styles.cancelar}>
                                Cancelar
                            </Text>
                        </TouchableOpacity>

                    </View>
                </View>
            </Modal>

        </View>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        position: 'relative',
        backgroundColor: '#FFFDF8',
    },

    conteudo: {
        paddingHorizontal: 20,
        paddingTop: 135,
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
        minWidth: 0,
        height: 44,
        marginTop: 0,
        paddingHorizontal: 20,
    },

    botaoFlutuante: {
        position: "absolute",
        right: 20,
        bottom: 20,
        width: 62,
        height: 62,
        borderRadius: 31,
        backgroundColor: "#FA9F2A",
        alignItems: "center",
        justifyContent: "center",
        elevation: 6,
        shadowColor: "#332716",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
    },

    vazio: {
        alignItems: "center",
        paddingVertical: 28,
    },

    bolinhaVazio: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "#FFF1DC",
        borderWidth: 1,
        borderColor: "#F2DFC4",
        alignItems: "center",
        justifyContent: "center",
    },

    textoVazio: {
        fontFamily: "Ruwudu-Regular",
        fontSize: 17,
        lineHeight: 24,
        color: "#75571F",
        textAlign: "center",
        marginTop: 12,
    },

    botaoVazio: {
        minWidth: 0,
        height: 44,
        paddingHorizontal: 26,
    },

    textoPublicar: {
        fontFamily: "Ruwudu-Bold",
        fontSize: 14,
        color: "#FFFDF8",
    },

    // publicações

    cardPublicacao: {
        borderRadius: 25,
        marginBottom: 20,
    },

    cabecalhoPost: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },

    fotoPost: {
        marginRight: 12,
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
        borderRadius: 18,
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

    modalFundo: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        padding: 20,
    },

    modalConteudo: {
        backgroundColor: "#FFFDF8",
        borderRadius: 30,
        padding: 20,
        gap: 12,
    },

    campoLegenda: {
        borderWidth: 1,
        borderColor: "#FA9F2A",
        backgroundColor: "#FFFFFF",
        borderRadius: 15,
        padding: 12,
        minHeight: 100,
        textAlignVertical: "top",
        color: "#332716",
    },

    botaoModal: {
        marginTop: 0,
    },

    cancelar: {
        fontFamily: "Ruwudu-Bold",
        fontSize: 16,
        textAlign: "center",
        padding: 12,
        color: "#A52C2C",
    },

});