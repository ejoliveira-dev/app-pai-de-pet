import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch, Alert, Modal } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { listarPets, obterPerfilTutor, salvarPerfilTutor, definirPetSelecionadoId } from '../database/Database';
import { useFocusEffect } from '@react-navigation/native';

import TelaComTopo from '../componentes/TelaComTopo';
import Cartao from '../componentes/Cartao';
import Botao from '../componentes/Botao';
import AvatarPet from '../componentes/AvatarPet';
import CampoTexto from '../componentes/CampoTexto';
import { cores, fontes, raio } from '../styles/tema';


const PERFIL_INICIAL = {
    nome: '',
    email: '',
    telefone: '',
    tema: 'padrao',
    exibirNoPerfilPublico: false,
    notificacoes: false
};

// Uma linha de configuração (ícone + texto + seta). "perigo" deixa em vermelho.
function LinhaConfig({ icone, texto, onPress, perigo }) {
    const cor = perigo ? cores.erro : cores.marrom;
    return (
        <Pressable style={styles.linhaConfig} onPress={onPress}>
            <View style={styles.bolinha}>
                <Ionicons name={icone} size={20} color={cor} />
            </View>
            <Text style={[styles.textoConfig, { color: cor }]}>{texto}</Text>
            <Ionicons name="chevron-forward" size={20} color={cor} />
        </Pressable>
    );
}


export default function Tutor({ navigation }) {
    const db = useSQLiteContext();

    const [perfil, setPerfil] = useState(PERFIL_INICIAL);
    const [pets, setPets] = useState([]);
    // controla a janela da engrenagem
    const [configVisivel, setConfigVisivel] = useState(false);

    // campos das informações pessoais
    const [nomeEdicao, setNomeEdicao] = useState('');
    const [emailEdicao, setEmailEdicao] = useState('');
    const [telefoneEdicao, setTelefoneEdicao] = useState('');

    // recupera o perfil e os pets
    useFocusEffect(
        useCallback(() => {
            let ativo = true;

            async function carregarDados() {
                try {
                    const [tutorSalvo, lista] = await Promise.all([
                        obterPerfilTutor(db),
                        listarPets(db)
                    ]);

                    const perfilAtual = {
                        ...PERFIL_INICIAL,
                        ...tutorSalvo
                    };

                    if (ativo) {
                        setPerfil(perfilAtual);
                        setPets(lista);
                    }

                } catch (erro) {
                    console.error('Erro ao carregar tutor:', erro);
                    Alert.alert('Erro', 'Não foi possível carregar o perfil.');
                }
            }

            carregarDados();

            return () => {
                ativo = false;
            };
        }, [db])
    );

    // Salva alterações do perfil
    async function atualizarPerfil(alteracoes) {
        const atualizado = { ...perfil, ...alteracoes };

        try {
            await salvarPerfilTutor(db, atualizado);

            setPerfil(atualizado);
            return true;

        } catch (erro) {
            console.error('Erro ao salvar tutor:', erro);
            Alert.alert('Erro', 'Não foi possível salvar.');
            return false;
        }
    }


    function abrirConfiguracoes() {
        setNomeEdicao(perfil.nome || '');
        setEmailEdicao(perfil.email || '');
        setTelefoneEdicao(perfil.telefone || '');

        setConfigVisivel(true);
    }

    async function salvarDadosConta() {

        const nome = nomeEdicao.trim();
        const email = emailEdicao.trim().toLowerCase();
        const telefone = telefoneEdicao.trim();

        // nome obrigatório
        if (!nome) {
            Alert.alert(
                'Campo obrigatório',
                'Informe o nome do tutor.'
            );
            return;
        }

        // validação do e-mail
        if (
            email &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ) {
            Alert.alert(
                'E-mail inválido',
                'Digite um e-mail válido.'
            );
            return;
        }

        // validação do telefone brasileiro
        const numeros = telefone.replace(/\D/g, '');

        if (
            numeros.length > 0 &&
            numeros.length !== 10 &&
            numeros.length !== 11
        ) {
            Alert.alert(
                'Telefone inválido',
                'Informe um telefone com DDD.'
            );
            return;
        }

        const sucesso = await atualizarPerfil({
            nome,
            email,
            telefone
        });

        if (sucesso) {
            Alert.alert(
                'Sucesso!',
                'Informações atualizadas com sucesso.'
            );
        }
    }


    // seleciona um pet e abre a Home
    async function selecionarPet(pet) {
        try {
            await definirPetSelecionadoId(db, pet.id_pet);

            navigation.navigate('Inicio', {
                petSelecionado: pet
            });

        } catch (erro) {
            Alert.alert('Erro', 'Não foi possível selecionar o pet.');
        }
    }

    // abre o cadastro em modo edição (segurar o dedo no pet)
    function editarPet(pet) {
        navigation.getParent()?.navigate('CadastroPets', { petParaEditar: pet });
    }

    function sairDaConta() {
        Alert.alert(
            'Sair da conta',
            'Deseja voltar à tela de boas-vindas?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Sair',
                    onPress: () => navigation.getParent()?.reset({
                        index: 0,
                        routes: [{ name: 'Welcome' }]
                    })
                }
            ]
        );
    }

    return (
        <TelaComTopo
            titulo="Perfil do Tutor"
            direita={
                <Pressable
                    style={styles.engrenagemPerfil}
                    onPress={abrirConfiguracoes}
                    accessibilityRole="button"
                    accessibilityLabel="Configurações do perfil"
                >
                    <Ionicons name="settings-outline" size={24} color={cores.marrom} />
                </Pressable>
            }
        >

            {/* cabeçalho do tutor */}
            <Cartao
                style={[
                    styles.cabecalhoPerfil,
                    perfil.tema === 'suave' && { backgroundColor: '#F2E6DC' }
                ]}
            >
                <View style={styles.avatarTutor}>
                    <Ionicons name="person" size={42} color={cores.marrom} />
                </View>

                <Text style={styles.nomeTutor}>
                    {perfil.nome || 'Seu perfil'}
                </Text>

                <Text style={styles.contagem}>
                    {pets.length} {pets.length === 1 ? 'pet cadastrado' : 'pets cadastrados'}
                </Text>

                {!perfil.nome ? (
                    <Botao
                        titulo="Completar perfil"
                        icone="create-outline"
                        variante="primario"
                        onPress={abrirConfiguracoes}
                        style={styles.botaoPequeno}
                    />
                ) : null}
            </Cartao>

            {/* lista de pets */}
            <Cartao style={styles.card}>
                <Text style={styles.textoCard}>Meus pets</Text>
                <Text style={styles.aviso}>
                    Toque para escolher o pet. Segure para editar.
                </Text>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.listaPets}
                >
                    {pets.map(pet => (
                        <Pressable
                            key={String(pet.id_pet)}
                            style={styles.itemPet}
                            onPress={() => selecionarPet(pet)}
                            onLongPress={() => editarPet(pet)}
                            delayLongPress={350}
                        >
                            <AvatarPet foto={pet.foto_perfil} tamanho={64} />

                            <Text style={styles.nomePet} numberOfLines={1}>
                                {pet.nome}
                            </Text>
                        </Pressable>
                    ))}

                    <Pressable
                        style={styles.itemPet}
                        onPress={() => navigation.getParent()?.navigate('CadastroPets')}
                    >
                        <View style={styles.botaoAdicionar}>
                            <Ionicons name="add" size={28} color={cores.marrom} />
                        </View>
                        <Text style={styles.nomePet}>Adicionar</Text>
                    </Pressable>
                </ScrollView>

                <View style={styles.divisor} />

                <LinhaConfig
                    icone="paw-outline"
                    texto="Gerenciar meus pets"
                    onPress={() => navigation.getParent()?.navigate('ListaPets')}
                />
            </Cartao>

            {/* privacidade e preferências */}
            <Cartao style={styles.card}>

                <Text style={styles.textoCard}>Preferências</Text>

                <View style={styles.linhaSwitch}>
                    <View style={styles.bolinha}>
                        <Ionicons name="eye-outline" size={20} color={cores.marrom} />
                    </View>

                    <Text style={styles.textoConfig}>
                        Mostrar tutor no perfil público
                    </Text>

                    <Switch
                        value={perfil.exibirNoPerfilPublico}
                        onValueChange={(valor) => {
                            if (valor && !perfil.nome.trim()) {
                                Alert.alert(
                                    'Informe seu nome',
                                    'Edite seu perfil antes de ativar essa opção.'
                                );
                                return;
                            }

                            atualizarPerfil({
                                exibirNoPerfilPublico: valor
                            });
                        }}
                        trackColor={{ false: '#C9C5BE', true: cores.laranja }}
                        thumbColor="#FFFFFF"
                    />
                </View>

                <Text style={styles.aviso}>
                    Desativado por padrão. Quando ativado, apenas seu nome
                    e um ícone serão exibidos no perfil público dos pets.
                </Text>

                <View style={styles.divisor} />

                <View style={styles.linhaSwitch}>
                    <View style={styles.bolinha}>
                        <Ionicons name="notifications-outline" size={20} color={cores.marrom} />
                    </View>

                    <Text style={styles.textoConfig}>
                        Preferência de notificações
                    </Text>

                    <Switch
                        value={perfil.notificacoes}
                        onValueChange={(valor) =>
                            atualizarPerfil({ notificacoes: valor })
                        }
                        trackColor={{ false: '#C9C5BE', true: cores.laranja }}
                        thumbColor="#FFFFFF"
                    />
                </View>

                <Text style={styles.aviso}>
                    Preferência local. Notificações automáticas ainda
                    não estão implementadas.
                </Text>

            </Cartao>

            {/* ajuda, sobre e conta */}
            <Cartao style={styles.card}>

                <LinhaConfig
                    icone="help-circle-outline"
                    texto="Ajuda e suporte"
                    onPress={() => Alert.alert(
                        'Ajuda e suporte',
                        'Para cadastrar um pet, utilize Meus Pets. Para acompanhar alimentação, peso, vacinas e outros cuidados, acesse a aba Meu Pet.'
                    )}
                />

                <View style={styles.divisor} />

                <LinhaConfig
                    icone="information-circle-outline"
                    texto="Sobre o Tutus"
                    onPress={() => Alert.alert(
                        'Sobre o Tutus',
                        'O Tutus é um aplicativo acadêmico desenvolvido em React Native para auxiliar tutores na organização e no acompanhamento dos cuidados de seus animais de estimação.\n\nVersão demonstrativa 1.0.'
                    )}
                />

                <View style={styles.divisor} />

                <LinhaConfig
                    icone="trash-outline"
                    texto="Excluir conta"
                    perigo
                    onPress={() => Alert.alert(
                        'Excluir conta',
                        'A exclusão de conta ainda não está disponível nesta versão demonstrativa. Nenhum dado será apagado.'
                    )}
                />

                <View style={styles.divisor} />

                <LinhaConfig
                    icone="log-out-outline"
                    texto="Sair da conta"
                    perigo
                    onPress={sairDaConta}
                />

            </Cartao>


            {/* JANELA DA ENGRENAGEM */}
            <Modal
                visible={configVisivel}
                animationType="slide"
                onRequestClose={() => setConfigVisivel(false)}
            >
                <TelaComTopo
                    titulo="Meu perfil"
                    subtitulo="Informações e personalização"
                    direita={
                        <Pressable
                            style={styles.engrenagemPerfil}
                            onPress={() => setConfigVisivel(false)}
                            accessibilityRole="button"
                            accessibilityLabel="Voltar ao perfil"
                        >
                            <Ionicons name="close" size={26} color={cores.marrom} />
                        </Pressable>
                    }
                >

                    {/* INFORMAÇÕES DO TUTOR */}
                    <Cartao style={styles.card}>

                        <Text style={[styles.textoCard, styles.espacoTitulo]}>
                            Informações do tutor
                        </Text>

                        <CampoTexto
                            label="Nome"
                            placeholder="Seu nome"
                            value={nomeEdicao}
                            onChangeText={setNomeEdicao}
                            maxLength={60}
                        />

                        <CampoTexto
                            label="E-mail"
                            placeholder="exemplo@email.com"
                            value={emailEdicao}
                            onChangeText={setEmailEdicao}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        <CampoTexto
                            label="Telefone"
                            placeholder="(00) 00000-0000"
                            value={telefoneEdicao}
                            onChangeText={setTelefoneEdicao}
                            keyboardType="phone-pad"
                            maxLength={16}
                        />

                        <Botao
                            titulo="Salvar informações"
                            larga
                            onPress={salvarDadosConta}
                            style={styles.botaoSalvar}
                        />

                        <Text style={styles.aviso}>
                            Seu e-mail e telefone não serão
                            exibidos no perfil público do pet.
                        </Text>

                    </Cartao>

                    {/* PERSONALIZAÇÃO */}
                    <Cartao style={styles.card}>

                        <Text style={[styles.textoCard, styles.espacoTitulo]}>
                            Personalização
                        </Text>

                        <Text style={styles.labelCampo}>
                            Aparência do perfil
                        </Text>

                        {/* tema padrão */}
                        <Pressable
                            style={[
                                styles.opcaoTema,
                                perfil.tema === 'padrao' &&
                                styles.opcaoSelecionada
                            ]}
                            onPress={() =>
                                atualizarPerfil({ tema: 'padrao' })
                            }
                        >
                            <Ionicons
                                name="color-palette-outline"
                                size={22}
                                color={cores.marrom}
                            />

                            <Text style={styles.textoConfig}>
                                Padrão Tutus
                            </Text>

                            {perfil.tema === 'padrao' && (
                                <Ionicons
                                    name="checkmark-circle"
                                    size={22}
                                    color={cores.laranja}
                                />
                            )}
                        </Pressable>

                        {/* tema suave */}
                        <Pressable
                            style={[
                                styles.opcaoTema,
                                perfil.tema === 'suave' &&
                                styles.opcaoSelecionada
                            ]}
                            onPress={() =>
                                atualizarPerfil({ tema: 'suave' })
                            }
                        >
                            <Ionicons
                                name="color-fill-outline"
                                size={22}
                                color={cores.marrom}
                            />

                            <Text style={styles.textoConfig}>
                                Tons suaves
                            </Text>

                            {perfil.tema === 'suave' && (
                                <Ionicons
                                    name="checkmark-circle"
                                    size={22}
                                    color={cores.laranja}
                                />
                            )}
                        </Pressable>

                        <Text style={[styles.aviso, { marginTop: 12 }]}>
                            Por enquanto, a personalização altera
                            apenas a cor do cabeçalho do Perfil
                            do Tutor. A personalização completa
                            do aplicativo será desenvolvida depois.
                        </Text>

                    </Cartao>

                </TelaComTopo>
            </Modal>

        </TelaComTopo>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: 16,
    },

    textoCard: {
        fontFamily: fontes.negrito,
        fontSize: 22,
        color: cores.marrom,
    },

    espacoTitulo: {
        marginBottom: 14,
    },

    cabecalhoPerfil: {
        backgroundColor: cores.laranjaClaro,
        alignItems: 'center',
        paddingVertical: 24,
        marginBottom: 16,
    },

    avatarTutor: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: cores.fundo,
        borderWidth: 3,
        borderColor: cores.laranja,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },

    nomeTutor: {
        fontFamily: fontes.negrito,
        fontSize: 26,
        color: cores.marrom,
        textAlign: 'center',
    },

    contagem: {
        fontFamily: fontes.regular,
        fontSize: 16,
        color: cores.marromClaro,
        marginTop: 4,
    },

    botaoPequeno: {
        minWidth: 0,
        height: 44,
        marginTop: 14,
        paddingHorizontal: 24,
    },

    engrenagemPerfil: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: cores.fundo,
        borderWidth: 1,
        borderColor: cores.bordaCreme,
        alignItems: 'center',
        justifyContent: 'center',
    },

    listaPets: {
        gap: 14,
        paddingTop: 14,
        paddingBottom: 4,
    },

    itemPet: {
        alignItems: 'center',
        width: 74,
    },

    botaoAdicionar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: cores.laranja,
        backgroundColor: cores.creme,
        alignItems: 'center',
        justifyContent: 'center',
    },

    nomePet: {
        fontFamily: fontes.regular,
        fontSize: 15,
        color: cores.marrom,
        marginTop: 6,
        textAlign: 'center',
        width: 74,
    },

    bolinha: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: cores.creme,
        borderWidth: 1,
        borderColor: cores.bordaCreme,
        alignItems: 'center',
        justifyContent: 'center',
    },

    linhaConfig: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 6,
    },

    linhaSwitch: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 12,
        marginBottom: 6,
    },

    textoConfig: {
        flex: 1,
        fontFamily: fontes.regular,
        fontSize: 17,
        color: cores.marrom,
    },

    aviso: {
        fontFamily: fontes.regular,
        fontSize: 14,
        lineHeight: 20,
        color: cores.marromClaro,
        marginTop: 4,
    },

    divisor: {
        height: 1,
        backgroundColor: cores.bordaCreme,
        marginVertical: 10,
    },

    botaoSalvar: {
        marginTop: 4,
        marginBottom: 12,
    },

    labelCampo: {
        fontFamily: fontes.negrito,
        fontSize: 17,
        color: cores.marrom,
    },

    opcaoTema: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: cores.fundo,
        borderWidth: 1.5,
        borderColor: cores.bordaCreme,
        padding: 14,
        borderRadius: raio.campo,
        marginTop: 10,
    },

    opcaoSelecionada: {
        backgroundColor: cores.laranjaClaro,
        borderColor: cores.laranja,
    },
});