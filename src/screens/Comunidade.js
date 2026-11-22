
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
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable, Image, Modal, TextInput, Animated, StatusBar, RefreshControl, ActivityIndicator, Alert as AlertNativo } from 'react-native';
import { Alert } from "../componentes/AlertaTutus";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
    const [abaAtiva, setAbaAtiva] = useState("publicacoes");
    const [modalAberto, setModalAberto] = useState(false);
    const [legenda, setLegenda] = useState("");
    const [foto, setFoto] = useState(null);
    const [salvando, setSalvando] = useState(false);
    const [curtidos, setCurtidos] = useState({});
    const [totalCurtidas, setTotalCurtidas] = useState({});
    const [totalComentarios, setTotalComentarios] = useState({});
    const [carregandoFeed, setCarregandoFeed] = useState(true);
    const [postComentario, setPostComentario] = useState(null);
    const [comentarios, setComentarios] = useState([]);
    const [textoComentario, setTextoComentario] = useState("");
    const [enviandoComentario, setEnviandoComentario] = useState(false);
    const [carregandoComentarios, setCarregandoComentarios] = useState(false);
    const curtidasEmAndamento = useRef(new Set());
    const [idTutor, setIdTutor] = useState(null);
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

                    const emailTutor = await AsyncStorage.getItem("usuarioLogado");
                        if (ativo) {
                            setIdTutor(emailTutor);
                        }   
                    const encontrado = id ? await buscarPet(db, id) : null;

                    const resposta = await fetch(
                         "https://app-pai-de-pet.onrender.com/publicacoes"
                    );

                    if (!resposta.ok) {
                        throw new Error("Erro ao carregar publicações.");
                    }

                    const listaPosts = await resposta.json();

                    // Buscar as curtidas salvas de cada publicação
                    const resultadosCurtidas = await Promise.all(
                        listaPosts.map(async (post) => {
                            const parametros = new URLSearchParams({
                                id_pet: String(encontrado?.id_pet ?? ""),
                                id_tutor: emailTutor ?? ""
                            });

                            const respostaCurtidas = await fetch(
                                `https://app-pai-de-pet.onrender.com/curtidas/${post.id}?${parametros.toString()}`
                            );

                            if (!respostaCurtidas.ok) {
                                throw new Error("Erro ao carregar curtidas.");
                            }

                            const dados = await respostaCurtidas.json();

                            // quantidade de comentários do post
                            const respostaComentarios = await fetch(
                                `https://app-pai-de-pet.onrender.com/comentarios/${post.id}`
                            );

                            const listaComentarios = respostaComentarios.ok
                                ? await respostaComentarios.json()
                                : [];

                            return {
                                id: post.id,
                                total: dados.total,
                                curtiu: dados.curtiu,
                                comentarios: Array.isArray(listaComentarios) ? listaComentarios.length : 0
                            };
                        })
                    );

                    const curtidasSalvas = {};
                    const totaisSalvos = {};
                    const comentariosSalvos = {};

                    resultadosCurtidas.forEach((item) => {
                        curtidasSalvas[item.id] = item.curtiu;
                        totaisSalvos[item.id] = item.total;
                        comentariosSalvos[item.id] = item.comentarios;
                    });

                    if (ativo) {
                        setPet(encontrado);
                        setPublicacoes(listaPosts);
                        setCurtidos(curtidasSalvas);
                        setTotalCurtidas(totaisSalvos);
                        setTotalComentarios(comentariosSalvos);
                    }

                    resultadosCurtidas.forEach((item) => {
                        curtidasSalvas[item.id] = item.curtiu;
                        totaisSalvos[item.id] = item.total;
                    });                   

                    if (ativo) {
                        setPet(encontrado);
                        setPublicacoes(listaPosts);
                        setCurtidos(curtidasSalvas);
                        setTotalCurtidas(totaisSalvos);
                    }

                } catch (erro) {
                    console.error(
                        'Erro ao carregar pet público:',
                        erro
                    );

                    if (ativo) setPet(null);
                } finally {
                    if (ativo) setCarregandoFeed(false);
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
                   allowsEditing: true,
                   aspect: [4, 5],
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

    const API_URL = "https://app-pai-de-pet.onrender.com";

    try {
        let imagemId = null;

    // Enviar a foto de perfil do pet para o servidor
    let fotoPetPublica = null;

    if (pet.foto_perfil) {
        const arquivoPet = new File(pet.foto_perfil);
        const formDataPet = new FormData();

        formDataPet.append("foto", arquivoPet);

        const respostaPet = await fetch(`${API_URL}/upload-foto`, {
            method: "POST",
            body: formDataPet
        });

        if (!respostaPet.ok) {
            throw new Error("Erro ao enviar foto de perfil do pet.");
        }

        const dadosPet = await respostaPet.json();

        fotoPetPublica = `${API_URL}/imagens/${dadosPet.imagem_id}`;
    }

        // Enviar imagem ao servidor
        if (foto) {
            const arquivo = new File(foto);
            const formData = new FormData();

            formData.append("foto", arquivo);

            const respostaFoto = await fetch(`${API_URL}/upload-foto`, {
                method: "POST",
                body: formData
            });

            if (!respostaFoto.ok) {
                throw new Error(`Erro ao enviar foto: ${respostaFoto.status}`);
            }

            const dadosFoto = await respostaFoto.json();
            imagemId = dadosFoto.imagem_id;

            if (!imagemId) {
                throw new Error("Servidor não retornou o ID da imagem.");
            }
        }

        // Salvar publicação no PostgreSQL
        const resposta = await fetch(`${API_URL}/publicacoes`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id_pet: String(pet.id_pet),
                id_tutor: idTutor,
                nome_pet: pet.nome,
                foto_pet: fotoPetPublica,
                legenda: legenda.trim(),
                imagem_id: imagemId
            })
        });

        if (!resposta.ok) {
            throw new Error(`Erro ao publicar: ${resposta.status}`);
        }

        // Atualizar publicações
        const respostaFeed = await fetch(`${API_URL}/publicacoes`);

        if (!respostaFeed.ok) {
            throw new Error("Erro ao atualizar o feed.");
        }

        setPublicacoes(await respostaFeed.json());

        setLegenda("");
        setFoto(null);
        setModalAberto(false);

        Alert.alert("Sucesso", "Publicação criada!");

    } catch (erro) {
        console.error("Erro ao publicar:", erro);
        Alert.alert("Erro", "Não foi possível concluir a publicação.");
    } finally {
        setSalvando(false);
    }
}

    // primeiro nome do pet para a barra de publicar
    const primeiroNome = pet?.nome?.split(' ')[0] || 'seu pet';

    // filtra as publicações de acordo com a aba ativa
    const publicacoesExibidas = abaAtiva === "meusPosts"
        ? publicacoes.filter((post) => post.id_pet === String(pet?.id_pet) && post.id_tutor === idTutor)
        : publicacoes;

    // texto das curtidas: "Curtido por você e mais 2 pessoas" ou "3 curtidas".
    function textoCurtidas(id) {
        const total = totalCurtidas[id] || 0;

        if (total === 0) return '';

        if (curtidos[id]) {
            const outros = total - 1;

            if (outros === 0) return 'Curtido por você';

            return `Curtido por você e mais ${outros} ${outros === 1 ? 'pessoa' : 'pessoas'}`;
        }

        return `${total} ${total === 1 ? 'curtida' : 'curtidas'}`;
    }
    
    // curtir/descurtir
    async function alternarCurtida(id) {
        if (!pet?.id_pet || !idTutor) {
            Alert.alert("Atenção!", "Você precisa escolher um dos seus pets para curtir.");
            return;
        }

        // Impedir solicitações repetidas enquanto salva
        if (curtidasEmAndamento.current.has(id)) return;

        curtidasEmAndamento.current.add(id);

        try {
            const jaCurtiu = !!curtidos[id];

            const resposta = await fetch(
                "https://app-pai-de-pet.onrender.com/curtidas",
                {
                    method: jaCurtiu ? "DELETE" : "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        id_publicacao: id,
                        id_pet: String(pet.id_pet),
                        id_tutor: idTutor
                    })
                }
            );

            if (!resposta.ok) {
                throw new Error("Erro ao atualizar curtida.");
            }

            // Consultar o estado verdadeiro no banco
            const parametros = new URLSearchParams({
                id_pet: String(pet.id_pet),
                id_tutor: idTutor
            });

            const consulta = await fetch(
                `https://app-pai-de-pet.onrender.com/curtidas/${id}?${parametros.toString()}`
            );

            if (!consulta.ok) {
                throw new Error("Erro ao consultar curtidas.");
            }

            const dados = await consulta.json();

            setCurtidos((atual) => ({
                ...atual,
                [id]: dados.curtiu
            }));

            setTotalCurtidas((atual) => ({
                ...atual,
                [id]: dados.total
            }));

        } catch (erro) {
            console.error("Erro ao curtir publicação:", erro);
            Alert.alert("Erro", "Não foi possível atualizar a curtida.");
        } finally {
            curtidasEmAndamento.current.delete(id);
        }
    }
    
    // toque duplo na foto curte o post apenas uma vez, mas continua aparecendo a animação(igual ao Insta)
    function tocarFoto(id) {
        const agora = Date.now();

        if (agora - (ultimoToque.current[id] || 0) < 300) {

            // Mostrar a animação sempre
            setCoracaoVisivel(id);
            escalaCoracao.setValue(0);

            Animated.sequence([
                Animated.spring(escalaCoracao, {
                    toValue: 1,
                    friction: 4,
                    tension: 120,
                    useNativeDriver: true
                }),
                Animated.delay(250),
                Animated.timing(escalaCoracao, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true
                }),
            ]).start(() => setCoracaoVisivel(null));

            // Só registrar curtida se o pet ainda não curtiu
            if (!curtidos[id]) {
                alternarCurtida(id);
            }
        }

        ultimoToque.current[id] = agora;
    }

    // Buscar comentários de uma publicação
    async function abrirComentarios(post) {
        setPostComentario(post);
        setComentarios([]);
        setTextoComentario("");
        setCarregandoComentarios(true);

        try {
            const resposta = await fetch(
                `https://app-pai-de-pet.onrender.com/comentarios/${post.id}`
            );

            if (!resposta.ok) {
                throw new Error("Erro ao buscar comentários.");
            }

            const dados = await resposta.json();
            setComentarios(dados);
        } catch (erro) {
            console.error("Erro ao carregar comentários:", erro);
            Alert.alert("Erro", "Não foi possível carregar os comentários.");
        } finally {
            setCarregandoComentarios(false);
        }
    }

    // Enviar comentário para uma publicação
    async function enviarComentario() {
        if (enviandoComentario || !postComentario || !textoComentario.trim()) return;

        if (!pet?.id_pet || !idTutor) {
            Alert.alert("Atenção!", "Selecione um pet antes de comentar.");
            return;
        }

        setEnviandoComentario(true);

        try {

            // Buscar uma foto pública já enviada pelo pet
            let fotoPetPublica = publicacoes.find(
                (post) => post.id_pet === String(pet.id_pet) &&
                        post.id_tutor === idTutor &&
                        post.foto_pet
            )?.foto_pet || null;

            // Se ainda não existe foto pública, enviar ao servidor
            if (!fotoPetPublica && pet.foto_perfil) {
                const arquivoPet = new File(pet.foto_perfil);
                const formDataPet = new FormData();

                formDataPet.append("foto", arquivoPet);

                const respostaFoto = await fetch(
                    "https://app-pai-de-pet.onrender.com/upload-foto",
                    { method: "POST", body: formDataPet }
                );

                if (!respostaFoto.ok) {
                    throw new Error("Erro ao enviar foto do pet.");
                }

                const dadosFoto = await respostaFoto.json();
                fotoPetPublica = `https://app-pai-de-pet.onrender.com/imagens/${dadosFoto.imagem_id}`;
            }

            const resposta = await fetch(
                "https://app-pai-de-pet.onrender.com/comentarios",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        id_publicacao: postComentario.id,
                        id_pet: String(pet.id_pet),
                        id_tutor: idTutor,
                        nome_pet: pet.nome,
                        foto_pet: fotoPetPublica,
                        texto: textoComentario.trim()
                    })
                }
            );

            if (!resposta.ok) {
                throw new Error("Erro ao enviar comentário.");
            }

            const novoComentario = await resposta.json();

            setComentarios((atual) => [...atual, novoComentario]);
            setTextoComentario("");

            setTotalComentarios((atual) => ({
                ...atual,
                [postComentario.id]: (atual[postComentario.id] || 0) + 1
            }));

        } catch (erro) {
            console.error("Erro ao comentar:", erro);
            Alert.alert("Erro", "Não foi possível enviar o comentário.");
        } finally {
            setEnviandoComentario(false);
        }
    }

    // Mostrar opção de excluir comentário
    function mostrarOpcoesComentario(comentario) {
        if (
            comentario.id_pet !== String(pet?.id_pet) ||
            comentario.id_tutor !== idTutor
        ) return;

        Alert.alert(
            "Opções do comentário",
            "O que deseja fazer?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Excluir comentário",
                    style: "destructive",
                    onPress: () => confirmarExclusaoComentario(comentario)
                }
            ]
        );
    }

    // Confirmar e excluir comentário
    function confirmarExclusaoComentario(comentario) {
        Alert.alert(
            "Excluir comentário",
            "Deseja realmente excluir este comentário?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Excluir",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const resposta = await fetch(
                                `https://app-pai-de-pet.onrender.com/comentarios/${comentario.id}`,
                                {
                                    method: "DELETE",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                        id_pet: String(pet.id_pet),
                                        id_tutor: idTutor
                                    })
                                }
                            );

                            if (!resposta.ok) {
                                throw new Error("Erro ao excluir comentário.");
                            }

                            setComentarios((atual) =>
                                atual.filter((item) => item.id !== comentario.id)
                            );

                            
                            setTotalComentarios((atual) => ({
                                ...atual,
                                [postComentario.id]: Math.max(0, (atual[postComentario.id] || 1) - 1)
                            }));

                            Alert.alert("Pronto!", "Comentário excluído com sucesso!");
                        } catch (erro) {
                            console.error("Erro ao excluir comentário:", erro);
                            Alert.alert("Erro", "Não foi possível excluir o comentário.");
                        }
                    }
                }
            ]
        );
    }

    // Confirmar e excluir publicação
    function confirmarExclusao(post) {
        Alert.alert(
            "Excluir publicação",
            "Deseja realmente excluir esta publicação?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Excluir",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const resposta = await fetch(
                                `https://app-pai-de-pet.onrender.com/publicacoes/${post.id}`,
                                {
                                    method: "DELETE",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                        id_pet: String(pet.id_pet),
                                        id_tutor: idTutor
                                    })
                                }
                            );

                            if (!resposta.ok) {
                                throw new Error("Erro ao excluir publicação.");
                            }

                            setPublicacoes((atual) => atual.filter((item) => item.id !== post.id));

                            Alert.alert("Pronto!", "Publicação excluída com sucesso!");
                        } catch (erro) {
                            console.error("Erro ao excluir publicação:", erro);
                            Alert.alert("Erro", "Não foi possível excluir a publicação.");
                        }
                    }
                }
            ]
        );
    }

    // puxar para atualizar o feed
    async function atualizarFeed() {
        setAtualizando(true);

        try {
            const resposta = await fetch(
                "https://app-pai-de-pet.onrender.com/publicacoes"
           );

             if (!resposta.ok) {
                throw new Error("Erro ao atualizar o feed.");
            }

             const lista = await resposta.json();
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
                style={styles.rolagemFeed}
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

                {/* abas de Publicações e Meus posts */}
                <View style={styles.abasComunidade}>
                    <TouchableOpacity
                        style={[styles.botaoAba, abaAtiva === "publicacoes" && styles.abaSelecionada]}
                        onPress={() => setAbaAtiva("publicacoes")}
                    >
                        <Text style={[styles.textoAba, abaAtiva === "publicacoes" && styles.textoAbaSelecionada]}>
                            Publicações
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.botaoAba, abaAtiva === "meusPosts" && styles.abaSelecionada]}
                        onPress={() => setAbaAtiva("meusPosts")}
                    >
                        <Text style={[styles.textoAba, abaAtiva === "meusPosts" && styles.textoAbaSelecionada]}>
                            Minhas publicações
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* publicações cadastradas */}
                {carregandoFeed && publicacoes.length === 0 ? (
                    <View style={styles.carregandoFeed}>
                        <ActivityIndicator size="large" color={cores.laranja} />
                        <Text style={styles.textoCarregandoFeed}>Carregando publicações...</Text>
                    </View>
                ) : publicacoesExibidas.length === 0 ? (
                    <View style={styles.vazio}>
                        <Text style={styles.textoVazio}>
                            Nenhuma publicação ainda.{'\n'}Toque no + para criar a primeira!
                        </Text>
                    </View>
                ) : (
                    publicacoesExibidas.map((post) => (
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
                                {/* botão de excluir só aparece na aba "Minhas publicações" */}
                                {abaAtiva === "meusPosts" && (
                                <Pressable
                                    onPress={() => confirmarExclusao(post)}
                                    hitSlop={10}
                                    accessibilityRole="button"
                                    accessibilityLabel="Excluir publicação"
                                    style={({ pressed }) => pressed && styles.pressionado}
                                >
                                    <Ionicons name="trash-outline" size={19} color="#D64545" />
                                </Pressable>
                            )}                   
                            </View>

                            {post.imagem_id ? (
                                <Pressable onPress={() => tocarFoto(post.id)}>
                                    <Image
                                        source={{
                                        uri: `https://app-pai-de-pet.onrender.com/imagens/${post.imagem_id}`
                                        }}
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

                                                                {/* abrir comentários da publicação */}
                                <Pressable
                                    onPress={() => abrirComentarios(post)}
                                    hitSlop={10}
                                    accessibilityRole="button"
                                    accessibilityLabel="Ver comentários"
                                    style={({ pressed }) => [styles.acaoComNumero, pressed && styles.pressionado]}
                                >
                                    <Ionicons name="chatbubble-outline" size={25} color={cores.marrom} />
                                    {totalComentarios[post.id] > 0 && (
                                        <Text style={styles.numeroAcao}>{totalComentarios[post.id]}</Text>
                                    )}
                                </Pressable>

                            </View>

                            {/* "Curtido por você e mais X pessoas" (igual ao Insta) */}
                            {textoCurtidas(post.id) ? (
                                <Text style={styles.textoCurtida}>
                                    {textoCurtidas(post.id)}
                                </Text>
                            ) : null}

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

            {/* Área de comentários estilo Instagram */}
            <Modal
                visible={postComentario !== null}
                animationType="slide"
                transparent
                onRequestClose={() => setPostComentario(null)}
            >
                <View style={styles.fundoComentarios}>

                    {/* Tocar fora fecha os comentários */}
                    <Pressable
                        style={styles.preencherFundoComentarios}
                        onPress={() => setPostComentario(null)}
                    />

                    <View style={styles.painelComentarios}>

                        <View style={styles.puxadorComentarios} />

                        <View style={styles.cabecalhoComentarios}>
                            <Text style={styles.tituloComentarios}>
                                Comentários
                            </Text>

                            <Pressable
                                onPress={() => setPostComentario(null)}
                                style={styles.fecharComentarios}
                            >
                                <Ionicons name="close" size={24} color={cores.marrom} />
                            </Pressable>
                        </View>

                        {/* Lista dos comentários */}
                        <ScrollView
                            style={styles.listaComentarios}
                            contentContainerStyle={styles.conteudoListaComentarios}
                            keyboardShouldPersistTaps="handled"
                        >
                            {carregandoComentarios ? (
                                <Text style={styles.textoCarregandoComentarios}>
                                    Carregando comentários...
                                </Text>
                            ) : comentarios.length === 0 ? (
                                <Text style={styles.textoSemComentarios}>
                                    Nenhum comentário ainda. Seja o primeiro! 🐾
                                </Text>
                            ) : (
                                comentarios.map((comentario) => (
                                    <Pressable
                                        key={String(comentario.id)}
                                        onLongPress={() => mostrarOpcoesComentario(comentario)}
                                        delayLongPress={400}
                                        style={styles.itemComentario}
                                    >

<AvatarPet                               foto={comentario.foto_pet} tamanho={38} />

                                        <View style={styles.corpoComentario}>
                                            <Text style={styles.nomeComentario}>
                                                {comentario.nome_pet}
                                            </Text>

                                            <Text style={styles.textoComentario}>
                                                {comentario.texto}
                                            </Text>

                                            <Text style={styles.dataComentario}>
                                                {tempoRelativo(comentario.criado_em)}
                                            </Text>
                                        </View>
                                    {/* Opções para excluir o próprio comentário */}
                                        {comentario.id_pet === String(pet?.id_pet) &&
                                        comentario.id_tutor === idTutor && (
                                            <Pressable
                                                onPress={() => mostrarOpcoesComentario(comentario)}
                                                hitSlop={10}
                                                accessibilityRole="button"
                                                accessibilityLabel="Opções do comentário"
                                                style={styles.opcoesComentario}
                                            >
                                                <Ionicons name="ellipsis-horizontal" size={22} color={cores.marrom} />
                                            </Pressable>
                                        )}                
                                    </Pressable>
                                ))
                            )}
                        </ScrollView>

                        {/* Campo para escrever comentário */}
                        <View style={[styles.rodapeComentarios, { paddingBottom: Math.max(insets.bottom, 15) }]}>
                            <AvatarPet foto={pet?.foto_perfil} tamanho={36} />

                            <TextInput
                                style={styles.inputComentario}
                                placeholder="Adicione um comentário..."
                                placeholderTextColor="#A89A82"
                                value={textoComentario}
                                onChangeText={setTextoComentario}
                                maxLength={500}
                                multiline
                            />

                            <Pressable
                                onPress={enviarComentario}
                                disabled={enviandoComentario || !textoComentario.trim()}
                            >
                                <Ionicons
                                    name="arrow-up-circle"
                                    size={32}
                                    color={textoComentario.trim() ? cores.laranja : "#C9C1B5"}
                                />
                            </Pressable>
                        </View>

                    </View>
                </View>
            </Modal>

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
                    <Pressable style={styles.preencherFundoComentarios} onPress={fecharPublicacao} />

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
        gap: 16,
        paddingHorizontal: 14,
        paddingTop: 10,
        paddingBottom: 12,
    },

    textoCurtida: {
        fontFamily: fontes.regular,
        fontSize: 14,
        lineHeight: 20,
        color: cores.marromClaro,
        paddingHorizontal: 14,
        marginTop: -4,
        paddingBottom: 14,
    },

    acaoComNumero: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },

    numeroAcao: {
        fontFamily: fontes.negrito,
        fontSize: 15,
        lineHeight: 28,
        color: cores.marrom,
        transform: [{ translateY: 3 }],
    },

    carregandoFeed: {
        alignItems: 'center',
        gap: 10,
        paddingVertical: 40,
    },

    textoCarregandoFeed: {
        fontFamily: fontes.regular,
        fontSize: 15,
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

    abasComunidade: {
    flexDirection: "row",
    marginBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#E8DED1",

    },
    botaoAba: {
        flex: 1,
        alignItems: "center",
        paddingVertical: 12,
    },

    abaSelecionada: {
        borderBottomWidth: 3,
        borderBottomColor: cores.laranja,
    },

    textoAba: {
        fontFamily: fontes.regular,
        fontSize: 16,
        color: cores.marromClaro,
    },

    textoAbaSelecionada: {
        fontFamily: fontes.negrito,
        color: cores.marrom,
    },

    // Estilos da área de comentários (antes definidos diretamente no JSX)
    rolagemFeed: {
        flex: 1,
    },

    fundoComentarios: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(0,0,0,0.45)",
    },

    painelComentarios: {
        height: "78%",
        backgroundColor: cores.fundo,
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        paddingTop: 12,
    },

    puxadorComentarios: {
        width: 40,
        height: 5,
        borderRadius: 5,
        backgroundColor: "#D4C9BB",
        alignSelf: "center",
        marginBottom: 15,
    },

    cabecalhoComentarios: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#E8DED1",
    },

    tituloComentarios: {
        fontFamily: fontes.negrito,
        fontSize: 18,
        color: cores.marrom,
    },

    fecharComentarios: {
        position: "absolute",
        right: 20,
        top: 0,
    },

    listaComentarios: {
        flex: 1,
    },

    conteudoListaComentarios: {
        padding: 20,
        gap: 20,
    },

    textoCarregandoComentarios: {
        textAlign: "center",
        color: cores.marromClaro,
    },

    textoSemComentarios: {
        textAlign: "center",
        fontFamily: fontes.regular,
        color: cores.marromClaro,
        marginTop: 30,
    },

    itemComentario: {
        flexDirection: "row",
        gap: 10,
        alignItems: "flex-start",
    },

    avatarComentario: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: "#FFE7C2",
        justifyContent: "center",
        alignItems: "center",
    },

    corpoComentario: {
        flex: 1,
    },

    nomeComentario: {
        fontFamily: fontes.negrito,
        color: cores.marrom,
        fontSize: 15,
    },

    textoComentario: {
        fontFamily: fontes.regular,
        color: cores.marrom,
        fontSize: 15,
    },

    dataComentario: {
        fontFamily: fontes.regular,
        fontSize: 12,
        color: cores.marromClaro,
        marginTop: 4,
    },

    opcoesComentario: {
        padding: 5,
    },

    rodapeComentarios: {
        flexDirection: "row",
        alignItems: "center",
        padding: 15,
        borderTopWidth: 1,
        borderTopColor: "#E8DED1",
        gap: 10,
    },

    inputComentario: {
        flex: 1,
        backgroundColor: cores.branco,
        borderRadius: 22,
        paddingHorizontal: 15,
        paddingVertical: 10,
        fontFamily: fontes.regular,
        color: cores.marrom,
        maxHeight: 100,
    },

    preencherFundoComentarios: StyleSheet.absoluteFillObject,
});
