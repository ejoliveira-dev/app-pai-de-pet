import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch, Alert, Modal } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { listarPets, obterPerfilTutor, salvarPerfilTutor, definirPetSelecionadoId, excluirPet } from '../database/Database';
import { useFocusEffect } from '@react-navigation/native';

import TelaComTopo from '../componentes/TelaComTopo';
import Cartao from '../componentes/Cartao';
import Botao from '../componentes/Botao';
import AvatarPet from '../componentes/AvatarPet';
import CampoTexto from '../componentes/CampoTexto';
import { cores, fontes, raio, sombra } from '../styles/tema';
import logo from '../../assets/images/logo-ofc-png-empty1.0.png';


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

    const [gerenciando, setGerenciando] = useState(false);

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

    // exclui um pet pelo modo "Gerenciar"
    function confirmarExclusao(pet) {
        Alert.alert(
            `Excluir ${pet.nome}?`,
            'Todos os registros, vacinas, consultas, medicamentos e publicações deste pet serão apagados. Isso não pode ser desfeito.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await excluirPet(db, pet.id_pet);

                            const restantes = pets.filter((p) => p.id_pet !== pet.id_pet);
                            setPets(restantes);

                            if (restantes.length === 0) setGerenciando(false);
                        } catch (erro) {
                            console.error('Erro ao excluir pet:', erro);
                            Alert.alert('Erro', 'Não foi possível excluir o pet.');
                        }
                    },
                },
            ]
        );
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
            centro={
                <Pressable
                    onPress={abrirConfiguracoes}
                    accessibilityRole="button"
                    accessibilityLabel="Editar perfil"
                    style={({ pressed }) => [styles.avatarTopo, pressed && styles.pressionado]}
                >
                    <Ionicons name="person" size={40} color={cores.laranja} />
                </Pressable>
            }
        >

            <Text style={styles.tituloTela}>Perfil do Tutor</Text>

            {/* cartão do tutor (marrom), com os dois números dentro */}
            <Pressable
                onPress={abrirConfiguracoes}
                accessibilityRole="button"
                accessibilityLabel="Editar perfil"
                style={({ pressed }) => [
                    styles.heroi,
                    perfil.tema === 'suave' && styles.heroiSuave,
                    pressed && styles.pressionado
                ]}
            >
                <View style={styles.heroiAnel} />

                <View style={styles.heroiLinha}>

                    <View style={styles.heroiTextos}>
                        <Text style={styles.heroiRotulo}>TUTOR</Text>

                        <Text style={styles.nomeTutor} numberOfLines={1}>
                            {perfil.nome || 'Seu perfil'}
                        </Text>

                        <Text style={styles.heroiDetalhe} numberOfLines={1}>
                            {perfil.nome
                                ? perfil.email || 'Toque para editar'
                                : 'Toque para completar seu perfil'}
                        </Text>
                    </View>
                </View>

                <View style={styles.numeros}>
                    <View style={styles.numeroBloco}>
                        <View style={styles.numeroBola}>
                            <Ionicons name="paw" size={18} color={cores.marrom} />
                        </View>
                        <View>
                            <Text style={styles.numeroValor}>{pets.length}</Text>
                            <Text style={styles.numeroLegenda}>
                                {pets.length === 1 ? 'pet' : 'pets'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.numeroBloco}>
                        <View style={[styles.numeroBola, styles.numeroBolaEscura]}>
                            <Ionicons
                                name={perfil.exibirNoPerfilPublico ? 'eye-outline' : 'eye-off-outline'}
                                size={18}
                                color={cores.laranjaClaro}
                            />
                        </View>
                        <View>
                            <Text style={styles.numeroValor}>
                                {perfil.exibirNoPerfilPublico ? 'Visível' : 'Oculto'}
                            </Text>
                            <Text style={styles.numeroLegenda}>no perfil público</Text>
                        </View>
                    </View>
                </View>
            </Pressable>

            {/* MEUS PETS */}
            <View style={styles.linhaTitulo}>
                <Text style={styles.tituloSecao}>Meus pets</Text>

                <Pressable
                    onPress={() => setGerenciando((atual) => !atual)}
                    hitSlop={10}
                    style={styles.link}
                >
                    <Text style={styles.textoLink}>
                        {gerenciando ? 'Concluir' : 'Gerenciar'}
                    </Text>
                    <Ionicons
                        name={gerenciando ? 'checkmark' : 'create-outline'}
                        size={16}
                        color={cores.laranja}
                    />
                </Pressable>
            </View>

            <View style={styles.cartao}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.listaPets}
                >
                    {pets.map(pet => (
                        <Pressable
                            key={String(pet.id_pet)}
                            style={({ pressed }) => [styles.itemPet, pressed && styles.pressionado]}
                            onPress={() => (gerenciando ? editarPet(pet) : selecionarPet(pet))}
                            onLongPress={() => editarPet(pet)}
                            delayLongPress={350}
                        >
                            <AvatarPet foto={pet.foto_perfil} tamanho={64} />

                            {gerenciando && (
                                <Pressable
                                    style={styles.badgeExcluir}
                                    onPress={() => confirmarExclusao(pet)}
                                    hitSlop={8}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Excluir ${pet.nome}`}
                                >
                                    <Ionicons name="close" size={15} color={cores.branco} />
                                </Pressable>
                            )}

                            <Text style={styles.nomePet} numberOfLines={1}>
                                {pet.nome}
                            </Text>
                        </Pressable>
                    ))}

                    <Pressable
                        style={({ pressed }) => [styles.itemPet, pressed && styles.pressionado]}
                        onPress={() => navigation.getParent()?.navigate('CadastroPets')}
                    >
                        <View style={styles.botaoAdicionar}>
                            <Ionicons name="add" size={28} color={cores.marrom} />
                        </View>
                        <Text style={styles.nomePet}>Adicionar</Text>
                    </Pressable>
                </ScrollView>

                <Text style={styles.dica}>
                    {gerenciando
                        ? 'Toque no pet para editar • no ✕ para excluir'
                        : 'Toque para escolher • segure para editar'}
                </Text>
            </View>

            {/* PREFERÊNCIAS */}
            <Text style={styles.tituloSecao}>Preferências</Text>

            <View style={styles.cartao}>

                <View style={styles.linhaSwitch}>
                    <View style={styles.bolinha}>
                        <Ionicons name="eye-outline" size={20} color={cores.marrom} />
                    </View>

                    <View style={styles.textosSwitch}>
                        <Text style={styles.textoConfig}>Mostrar no perfil público</Text>
                        <Text style={styles.aviso}>Só seu nome aparece para outros tutores</Text>
                    </View>

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

                <View style={styles.divisor} />

                <View style={styles.linhaSwitch}>
                    <View style={[styles.bolinha, styles.bolinhaEscura]}>
                        <Ionicons name="notifications-outline" size={20} color={cores.laranjaClaro} />
                    </View>

                    <View style={styles.textosSwitch}>
                        <Text style={styles.textoConfig}>Notificações</Text>
                        <Text style={styles.aviso}>Em breve: lembretes no celular</Text>
                    </View>

                    <Switch
                        value={perfil.notificacoes}
                        onValueChange={(valor) =>
                            atualizarPerfil({ notificacoes: valor })
                        }
                        trackColor={{ false: '#C9C5BE', true: cores.laranja }}
                        thumbColor="#FFFFFF"
                    />
                </View>

            </View>

            {/* CONTA */}
            <Text style={styles.tituloSecao}>Conta</Text>

            <View style={styles.cartao}>

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

            </View>

            {/* sair da conta: botão separado, como nos apps grandes */}
            <Pressable
                onPress={sairDaConta}
                accessibilityRole="button"
                style={({ pressed }) => [styles.botaoSair, pressed && styles.pressionado]}
            >
                <Ionicons name="log-out-outline" size={22} color={cores.erro} />
                <Text style={styles.textoSair}>Sair da conta</Text>
            </Pressable>

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
    tituloTela: {
        fontFamily: fontes.negrito,
        fontSize: 34,
        lineHeight: 44,
        color: cores.marrom,
        textAlign: 'center',
        marginBottom: 14,
    },


    heroi: {
        backgroundColor: cores.marrom,
        borderRadius: 30,
        padding: 16,
        overflow: 'hidden',
    },

    heroiSuave: {
        backgroundColor: cores.terracota,
    },

    heroiAnel: {
        position: 'absolute',
        top: -60,
        right: -50,
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: 'rgba(250, 159, 42, 0.13)',
    },

    heroiLinha: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },

    avatarTopo: {
        width: 95,
        height: 95,
        borderRadius: 44,
        backgroundColor: cores.marrom,
        borderWidth: 4,
        borderColor: cores.fundo,
        justifyContent: 'center',
        alignItems: 'center',
        ...sombra,
    },

    heroiTextos: {
        flex: 1,
        minWidth: 0,
    },

    heroiRotulo: {
        fontFamily: fontes.negrito,
        fontSize: 12,
        lineHeight: 22,
        letterSpacing: 1.6,
        color: cores.terracota,
    },

    nomeTutor: {
        fontFamily: fontes.negrito,
        fontSize: 26,
        lineHeight: 34,
        color: cores.laranjaClaro,
        paddingTop: 5,
    },

    heroiDetalhe: {
        fontFamily: fontes.regular,
        fontSize: 14,
        lineHeight: 20,
        color: 'rgba(255, 234, 200, 0.72)',
    },

    numeros: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 16,
    },

    numeroBloco: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: cores.branco,
        borderRadius: 20,
        paddingVertical: 9,
        paddingHorizontal: 11,
    },

    numeroBola: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: cores.laranja,
        alignItems: 'center',
        justifyContent: 'center',
    },

    numeroBolaEscura: {
        backgroundColor: cores.marrom,
    },

    numeroValor: {
        fontFamily: fontes.negrito,
        fontSize: 18,
        lineHeight: 24,
        color: cores.marrom,
    },

    numeroLegenda: {
        fontFamily: fontes.regular,
        fontSize: 12,
        lineHeight: 16,
        color: cores.marromClaro,
    },

    linhaTitulo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    tituloSecao: {
        fontFamily: fontes.negrito,
        fontSize: 24,
        lineHeight: 32,
        color: cores.marrom,
        marginTop: 22,
        marginBottom: 10,
    },

    link: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        marginTop: 12,
    },

    textoLink: {
        fontFamily: fontes.negrito,
        fontSize: 15,
        color: cores.laranja,
    },

    cartao: {
        backgroundColor: cores.branco,
        borderRadius: 25,
        padding: 14,
        ...sombra,
    },

    listaPets: {
        gap: 14,
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
        backgroundColor: cores.branco,
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

    badgeExcluir: {
        position: 'absolute',
        top: -2,
        right: 2,
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: cores.erro,
        borderWidth: 2,
        borderColor: cores.branco,
        alignItems: 'center',
        justifyContent: 'center',
    },

    dica: {
        fontFamily: fontes.regular,
        fontSize: 13,
        color: cores.marromClaro,
        textAlign: 'center',
        marginTop: 8,
    },

    bolinha: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: cores.laranja,
        alignItems: 'center',
        justifyContent: 'center',
    },

    bolinhaEscura: {
        backgroundColor: cores.marrom,
    },

    bolinhaPerigo: {
        backgroundColor: cores.erro,
    },

    linhaConfig: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 4,
    },

    linhaSwitch: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },

    textosSwitch: {
        flex: 1,
        minWidth: 0,
    },

    textoConfig: {
        flex: 1,
        fontFamily: fontes.regular,
        fontSize: 17,
        color: cores.marrom,
    },

    textoPerigo: {
        color: cores.erro,
    },

    aviso: {
        fontFamily: fontes.regular,
        fontSize: 13,
        lineHeight: 18,
        color: cores.marromClaro,
    },

    divisor: {
        height: 1,
        backgroundColor: 'rgba(51, 39, 22, 0.08)',
        marginVertical: 10,
    },

    botaoSair: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: cores.branco,
        borderRadius: 25,
        height: 54,
        marginTop: 16,
        marginBottom: 10,
        ...sombra,
    },

    textoSair: {
        fontFamily: fontes.negrito,
        fontSize: 18,
        color: cores.erro,
    },

    pressionado: {
        opacity: 0.7,
        transform: [{ scale: 0.97 }],
    },

    // ----- janela da engrenagem -----
    engrenagemPerfil: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: cores.fundo,
        alignItems: 'center',
        justifyContent: 'center',
    },

    card: {
        backgroundColor: cores.branco,
        borderRadius: 25,
        padding: 16,
        marginBottom: 16,
        borderWidth: 0,
        ...sombra,
    },

    textoCard: {
        fontFamily: fontes.negrito,
        fontSize: 22,
        color: cores.marrom,
    },

    espacoTitulo: {
        marginBottom: 14,
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
        backgroundColor: cores.branco,
        borderWidth: 1.5,
        borderColor: 'rgba(51, 39, 22, 0.1)',
        padding: 14,
        borderRadius: raio.campo,
        marginTop: 10,
    },

    opcaoSelecionada: {
        borderColor: cores.laranja,
    },
});