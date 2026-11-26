
import React, { useState, useCallback, useRef } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { buscarPet, obterPetSelecionadoId, listarPublicacoes, inserirPublicacao } from '../database/Database';
import { useFocusEffect } from '@react-navigation/native';

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from "expo-image-picker";
import { File, Paths } from "expo-file-system";

import AbaPerfilPublico, { ALTURA_FECHADA, MARGEM_TOPO } from "../componentes/AbaPerfilPublico";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Cartao from "../componentes/Cartao";
import Botao from "../componentes/Botao";
import AvatarPet from "../componentes/AvatarPet";
import { fontes, sombra } from "../styles/tema";
import { useTema } from "../styles/TemaContext";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable, Image, Modal, TextInput, Animated, StatusBar, RefreshControl, ActivityIndicator, Alert as AlertNativo, KeyboardAvoidingView, Platform } from 'react-native';
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
    const { cores } = useTema();
    const styles = criarStyles(cores);

    const [pet, setPet] = useState(null);
    const [petVisualizado, setPetVisualizado] = useState(null);
    const [historicoPerfis, setHistoricoPerfis] = useState([]);
    const [pedidoAbrir, setPedidoAbrir] = useState(0);
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

    // rolagem do feed e movimentação da aba do perfil   
    const rolagem = useRef(new Animated.Value(0)).current;
    const [menuAberto, setMenuAberto] = useState(false);
    const animacaoMenu = useRef(new Animated.Value(0)).current;
    const deslocamentoAba = rolagem.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -1],
        extrapolateLeft: 'clamp',
    });

    const aoRolar = Animated.event(
        [{ nativeEvent: { contentOffset: { y: rolagem } } }],
        { useNativeDriver: false }
    );

        function alternarMenu(abrir) {
            setMenuAberto(abrir);

            Animated.timing(animacaoMenu, {
                toValue: abrir ? 1 : 0,
                duration: 250,
                useNativeDriver: true,
            }).start();
        }

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

                    // mostra o pet na aba do perfil sem esperar o feed carregar
                    if (ativo) setPet(encontrado);

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

    // abre o perfil do pet de uma publicação
    function abrirPerfilPet(post) {
        if (!post?.id_pet) return;

        const ehMeuPet =
            String(post.id_pet) === String(pet?.id_pet) &&
            post.id_tutor === idTutor;

        if (ehMeuPet) {
            // tocou no próprio pet: mostra o seu perfil
            setPetVisualizado(null);
            setHistoricoPerfis([]);
        } else {
            const novoPet = {
                id_pet: String(post.id_pet),
                id_tutor: post.id_tutor,
                nome: post.nome_pet,
                foto_perfil: post.foto_pet || null
            };

            const mesmoPet =
                petVisualizado &&
                String(petVisualizado.id_pet) === novoPet.id_pet &&
                petVisualizado.id_tutor === novoPet.id_tutor;

            if (!mesmoPet) {
                if (petVisualizado) {
                    setHistoricoPerfis(lista => [...lista, petVisualizado]);
                }
                setPetVisualizado(novoPet);
            }
        }

        setPedidoAbrir(n => n + 1);
    }

    // volta para o perfil do pet anterior
    function voltarPerfilPet() {
        if (historicoPerfis.length === 0) return;

        const anterior = historicoPerfis[historicoPerfis.length - 1];

        setPetVisualizado(anterior);
        setHistoricoPerfis(lista => lista.slice(0, -1));
    }


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
                aspect: [1, 1],
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

            // ícone do botão de acordo com a espécie
            const especie = (pet?.especie || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

                const iconesEspecies = {
                    gato: "cat",
                    cachorro: "paw",
                    coelho: "rabbit",
                    hamster: "rodent",
                    "porquinho-da-india": "rodent",
                    tartaruga: "turtle",
                    peixe: "fish",
                    calopsita: "feather",
                    periquito: "feather",
                    canario: "feather",
                    papagaio: "feather",
                    furao: "paw",
                    "outro tipo de passaro": "feather",
                };


    const iconeEspecie = iconesEspecies[especie] || "paw";

    // texto das curtidas: só aparece se você curtiu junto com outras pessoas
    // ex.: "Você e mais 2 usuários curtiram"
    function textoCurtidas(id) {
        const total = totalCurtidas[id] || 0;

        if (!curtidos[id] || total <= 1) return '';

        const outros = total - 1;

        return `Você e mais ${outros} ${outros === 1 ? 'usuário curtiram' : 'usuários curtiram'}`;
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
            "Excluir comentário",
            "Deseja realmente excluir este comentário?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Excluir",
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
                <Text style={styles.comporTexto} numberOfLines={1}>
                    O que {primeiroNome} está aprontando?
                </Text>

                <Ionicons name="image-outline" size={24} color={cores.laranja} />           
                
                 </Pressable>

                {/* publicações cadastradas */}
                {carregandoFeed && publicacoes.length === 0 ? (
                    <View style={styles.carregandoFeed}>
                        <ActivityIndicator size="large" color={cores.laranja} />
                        <Text style={styles.textoCarregandoFeed}>Carregando publicações...</Text>
                    </View>
                ) : publicacoesExibidas.length === 0 ? (
                    <View style={styles.vazio}>

                 <Text style={styles.textoVazio}>
                    {abaAtiva === "meusPosts"
                        ? "Seu pet ainda não fez nenhuma publicação."
                        : "Nenhuma publicação por enquanto."}
                </Text>

                    </View>
                ) : (
                    publicacoesExibidas.map((post) => (
                        <View
                            key={String(post.id)}
                            style={styles.cardPublicacao}
                        >

                            <View style={styles.cabecalhoPost}>
                                {/* botão de abrir perfil do pet */}
                                <Pressable
                                    style={styles.anelAvatar}
                                    onPress={() => abrirPerfilPet(post)}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Ver perfil de ${post.nome_pet}`}
                                >
                                    <AvatarPet foto={post.foto_pet} tamanho={35} />
                                </Pressable>

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

                        {/* post só de texto */}
                        {!post.imagem_id && !!post.legenda && (
                            <Text style={[styles.legendaPost, styles.legendaSoTexto]}>
                                {post.legenda}
                            </Text>
                        )}

                            <View style={[styles.acoesPost, !post.imagem_id && styles.acoesSoTexto]}>
                                <Pressable
                                    onPress={() => alternarCurtida(post.id)}
                                    hitSlop={10}
                                    accessibilityRole="button"
                                    accessibilityLabel="Curtir"
                                    style={({ pressed }) => [styles.acaoComNumero, pressed && styles.pressionado]}
                                >
                                    <Ionicons
                                        name={curtidos[post.id] ? 'heart' : 'heart-outline'}
                                        size={25}
                                        color={curtidos[post.id] ? cores.laranja : cores.marrom}
                                        style={{ transform: [{ translateY: 1 }] }}
                                    />
                                    {totalCurtidas[post.id] > 0 && (
                                        <Text style={styles.numeroAcao}>{totalCurtidas[post.id]}</Text>
                                    )}
                                </Pressable>

                                {/* abrir comentários da publicação */}
                                <Pressable
                                    onPress={() => abrirComentarios(post)}
                                    hitSlop={10}
                                    accessibilityRole="button"
                                    accessibilityLabel="Ver comentários"
                                    style={({ pressed }) => [styles.acaoComNumero, pressed && styles.pressionado]}
                                >
                                    <Ionicons name="chatbubble-outline" size={24} color={cores.marrom} />
                                    {totalComentarios[post.id] > 0 && (
                                        <Text style={styles.numeroAcao}>{totalComentarios[post.id]}</Text>
                                    )}
                                </Pressable>

                            </View>

                            {/* "Você e mais X usuários curtiram" */}
                            {textoCurtidas(post.id) ? (
                                <Text style={styles.textoCurtida}>
                                    {textoCurtidas(post.id)}
                                </Text>
                            ) : null}

                            {!!post.imagem_id && !!post.legenda && (
                                <Text style={styles.legendaPost}>
                                    <Text style={styles.legendaNome}>{post.nome_pet} </Text>
                                    {post.legenda}
                                </Text>
                            )}

                        </View>
                    ))
                )}

            </Animated.ScrollView>
            
             {/* menu flutuante */}
            <View style={styles.menuFlutuante} pointerEvents="box-none">

                <Animated.View
                    pointerEvents={menuAberto ? "auto" : "none"}
                    style={{
                        position: "absolute",
                        bottom: 132,
                        opacity: animacaoMenu,
                        transform: [
                            { translateY: animacaoMenu.interpolate({ inputRange: [0, 1], outputRange: [126, 0] }) },
                            { scale: animacaoMenu }
                        ]
                    }}
                >
                    <TouchableOpacity
                        style={styles.botaoFlutuanteSecundario}
                        onPress={() => {
                            setAbaAtiva(abaAtiva === "publicacoes" ? "meusPosts" : "publicacoes");
                            alternarMenu(false);
                        }}
                        accessibilityLabel={abaAtiva === "publicacoes" ? "Minhas publicações" : "Feed público"}
                    >
                        {abaAtiva === "publicacoes" ? (
                            <Ionicons name="images-outline" size={25} color={cores.fundo} />
                        ) : (
                            <View style={{ alignItems: "center" }}>
                                <MaterialCommunityIcons name="paw" size={17} color={cores.fundo} />
                                <View style={{ flexDirection: "row", gap: 3 }}>
                                    <MaterialCommunityIcons name="feather" size={15} color={cores.fundo} />
                                    <MaterialCommunityIcons name="fish" size={15} color={cores.fundo} />
                                </View>
                            </View>
                        )}
                    </TouchableOpacity>
                </Animated.View>

                <Animated.View
                    pointerEvents={menuAberto ? "auto" : "none"}
                    style={{
                        position: "absolute",
                        bottom: 72,
                        opacity: animacaoMenu,
                        transform: [
                            { translateY: animacaoMenu.interpolate({ inputRange: [0, 1], outputRange: [66, 0] }) },
                            { scale: animacaoMenu }
                        ]
                    }}
                >
                    <TouchableOpacity
                        style={styles.botaoFlutuanteSecundario}
                        onPress={() => {
                            alternarMenu(false);
                            abrirPublicacao();
                        }}
                        accessibilityLabel="Nova publicação"
                    >
                        <Ionicons name="add" size={30} color={cores.fundo} />
                    </TouchableOpacity>
                </Animated.View>

                <TouchableOpacity
                    style={styles.botaoFlutuante}
                    onPress={() => alternarMenu(!menuAberto)}
                    accessibilityLabel={menuAberto ? "Fechar menu" : "Abrir menu"}
                >
                    {menuAberto ? (
                        <Ionicons name="chevron-down" size={30} color={cores.fundo} />
                    ) : (
                        <MaterialCommunityIcons name={iconeEspecie} size={30} color={cores.fundo} />
                    )}
                </TouchableOpacity>

            </View>


            <AbaPerfilPublico
                pet={petVisualizado || pet}
                publicacoes={publicacoes}
                onPublicar={abrirPublicacao}
                deslocamento={deslocamentoAba}
                carregando={carregandoFeed}
                perfilExterno={!!petVisualizado}
                onVoltarPerfil={voltarPerfilPet}
                podeVoltar={historicoPerfis.length > 0}
                idTutorAtual={idTutor}
                pedidoAbrir={pedidoAbrir}
                onFechar={() => {
                    setPetVisualizado(null);
                    setHistoricoPerfis([]);
                }}
            />


            {/* Área de comentários estilo Instagram */}
            <Modal
                visible={postComentario !== null}
                statusBarTranslucent
                navigationBarTranslucent
                animationType="slide"
                transparent
                onRequestClose={() => setPostComentario(null)}
            >
                <KeyboardAvoidingView style={styles.fundoComentarios} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

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

                                        <AvatarPet foto={comentario.foto_pet} tamanho={38} />

                                        <View style={styles.corpoComentario}>
                                            <Text style={styles.nomeComentario}>
                                                {comentario.nome_pet}{"  "}
                                                <Text style={styles.dataComentario}>
                                                    {tempoRelativo(comentario.criado_em)}
                                                </Text>
                                            </Text>

                                            <Text style={styles.textoComentario}>
                                                {comentario.texto}
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
                                                    <Ionicons name="ellipsis-horizontal" size={18} color={cores.marrom} />
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
                                placeholderTextColor={cores.marromClaro}
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
                </KeyboardAvoidingView>
            </Modal>

            {/* faixa marrom fixa atrás da barra de status */}
            <View style={[styles.faixaStatus, { height: insets.top }]} />

            <Modal
                visible={modalAberto}
                statusBarTranslucent
                navigationBarTranslucent
                animationType="slide"
                transparent
                onRequestClose={fecharPublicacao}
            >
                <KeyboardAvoidingView
                    style={styles.modalFundo}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >

                    {/* tocar fora fecha */}
                    <Pressable style={styles.preencherFundoComentarios} onPress={fecharPublicacao} />

                    <View style={[styles.modalConteudo, { paddingBottom: insets.bottom + 20 }]}>

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
                            placeholderTextColor={cores.marromClaro}
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
                </KeyboardAvoidingView>
            </Modal>

        </View>
    );
}

const criarStyles = (cores) => StyleSheet.create({

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
        lineHeight: 25,
        color: cores.marromClaro,
        textAlign: 'center',
        width: '100%',
    },

    cardPublicacao: {
        backgroundColor: '#FFFFFF',
        borderRadius: 25,
        overflow: 'hidden',
        marginBottom: 18,
        paddingBottom: 4,
        borderWidth: 1,
        borderColor: cores.bordaCartao,
        ...sombra,
    },

    cabecalhoPost: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },

    imagemPost: {
        width: '100%',
        aspectRatio: 1,
        backgroundColor: cores.marrom + '0F',
    },

    legendaPost: {
        fontFamily: fontes.regular,
        fontSize: 16,
        lineHeight: 23,
        color: cores.marrom,
        paddingHorizontal: 14,
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
    
    legendaSoTexto: {
        fontSize: 18,
        lineHeight: 26,
        includeFontPadding: false,
        marginBottom: -4,
    },

    modalFundo: {
        flex: 1,
        backgroundColor: 'rgba(30, 23, 15, 0.55)',
        justifyContent: 'flex-end',
    },

        menuFlutuante: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        alignItems: 'center',
        gap: 10,
        zIndex: 10,
    },

    botaoFlutuante: {
        width: 62,
        height: 62,
        borderRadius: 31,
        backgroundColor: cores.marrom,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 6,
        shadowColor: cores.marrom,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
    },

    botaoFlutuanteSecundario: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: cores.marrom,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 6,
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
        backgroundColor: cores.marrom + '26',
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
        borderColor: cores.marrom + '14',
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
        borderWidth: 1.5,
        borderColor: cores.laranja,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 10,
    },

    comporTexto: {
        flex: 1,
        fontFamily: fontes.regular,
        fontSize: 16,
        color: cores.marromClaro,
    },

    anelAvatar: {
        borderRadius: 26,
    },
    
    // linha do coração
    acoesPost: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 14,
        paddingTop: 8,
        paddingBottom: 6,
    },

    acoesSoTexto: {
        paddingTop: 0,
    },

    textoCurtida: {
        fontFamily: fontes.regular,
        fontSize: 14,
        lineHeight: 20,
        color: cores.marromClaro,
        paddingHorizontal: 14,
        marginBottom: 2,
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
        marginBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: cores.bordaCreme,
    },

    botaoAba: {
        flex: 1,
        alignItems: "center",
        paddingVertical: 8,
    },

    abaSelecionada: {
        borderBottomWidth: 3,
        borderBottomColor: cores.laranja,
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
        backgroundColor: cores.borda,
        alignSelf: "center",
        marginBottom: 15,
    },

    cabecalhoComentarios: {
        alignItems: "center",
        paddingBottom: 4,
    },

    tituloComentarios: {
        fontFamily: fontes.negrito,
        fontSize: 20,
        lineHeight: 40,
        color: cores.marrom,
        paddingBottom: 2,
    },

    listaComentarios: {
        flex: 1,
    },

    conteudoListaComentarios: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 18,
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
        gap: 12,
        alignItems: "flex-start",
    },

    avatarComentario: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: cores.laranjaClaro,
        justifyContent: "center",
        alignItems: "center",
    },

    corpoComentario: {
        flex: 1,
    },

    nomeComentario: {
        fontFamily: fontes.negrito,
        color: cores.marrom,
        fontSize: 16,
        lineHeight: 22,
    },

    textoComentario: {
        fontFamily: fontes.regular,
        color: cores.marrom,
        fontSize: 16,
        lineHeight: 28,
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
        borderTopColor: cores.bordaCreme,
        gap: 10,
    },

    inputComentario: {
        flex: 1,
        borderWidth: 1,
        borderColor: cores.bordaCreme,
        borderRadius: 22,
        paddingHorizontal: 15,
        paddingVertical: 8,
        fontFamily: fontes.regular,
        fontSize: 15,
        color: cores.marrom,
        maxHeight: 100,
    },

    preencherFundoComentarios: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
});
