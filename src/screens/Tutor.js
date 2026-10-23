import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable, TextInput, Switch, Alert, Modal } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';


const PERFIL_INICIAL = {
    nome: '',
    email: '',
    telefone: '',
    tema: 'padrao',
    exibirNoPerfilPublico: false,
    notificacoes: false
};

export default function Tutor({ navigation }) {

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
                    const [dadosTutor, dadosPets] =
                        await Promise.all([
                            AsyncStorage.getItem('@tutus:perfilTutor'),
                            AsyncStorage.getItem('@tutus:pets')
                        ]);

                    const tutorSalvo = dadosTutor
                        ? JSON.parse(dadosTutor)
                        : {};

                    const lista = dadosPets
                        ? JSON.parse(dadosPets)
                        : [];

                    const perfilAtual = {
                        ...PERFIL_INICIAL,
                        ...tutorSalvo
                    };

                    if (ativo) {
                        setPerfil(perfilAtual);
                        setPets(Array.isArray(lista) ? lista : []);
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
        }, [])
    );

    // Salva alterações do perfil
    async function atualizarPerfil(alteracoes) {
        const atualizado = { ...perfil, ...alteracoes };

        try {
            await AsyncStorage.setItem(
                '@tutus:perfilTutor',
                JSON.stringify(atualizado)
            );

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
            await AsyncStorage.setItem(
                '@tutus:petSelecionadoId',
                String(pet.id_pet)
            );

            navigation.navigate('Inicio', {
                petSelecionado: pet
            });

        } catch (erro) {
            Alert.alert('Erro', 'Não foi possível selecionar o pet.');
        }
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
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.conteudo}
            showsVerticalScrollIndicator={false}
        >

            <Text style={styles.titulo}>
                Perfil do Tutor
            </Text>

            {/* cabeçalho do tutor */}
            <View
                style={[
                    styles.cabecalhoPerfil,
                    perfil.tema === 'suave' && {
                        backgroundColor: '#F2E6DC'
                    }
                ]}
            >

                <View style={styles.linhaFotoConfiguracoes}>

                    {/* foto do tutor */}
                    <View style={[styles.avatarTutor, { marginBottom: 0 }]}>
                        <Ionicons
                            name="person"
                            size={45}
                            color="#80502D"
                        />
                    </View>

                    {/* engrenagem ao lado da foto */}
                    <Pressable
                        style={styles.engrenagemPerfil}
                        onPress={abrirConfiguracoes}
                        accessibilityRole="button"
                        accessibilityLabel="Configurações do perfil"
                    >
                        <Ionicons
                            name="settings-outline"
                            size={25}
                            color="#80502D"
                        />
                    </Pressable>

                </View>


                <Text style={styles.nomeTutor}>
                    {perfil.nome || 'Seu perfil'}
                </Text>

                <Text style={styles.contagem}>
                    {pets.length} {pets.length === 1 ? 'pet cadastrado' : 'pets cadastrados'}
                </Text>

            </View>

            {/* lista de pets */}
            <View style={styles.card}>
                <Text style={styles.textoCard}>Meus Pets 🐾</Text>

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
                        >
                            {pet.foto_perfil ? (
                                <Image
                                    source={{ uri: pet.foto_perfil }}
                                    style={styles.avatarPet}
                                />
                            ) : (
                                <View style={[styles.avatarPet, styles.semFoto]}>
                                    <Ionicons name="paw" size={24} color="#80502D" />
                                </View>
                            )}

                            <Text style={styles.nomePet} numberOfLines={1}>
                                {pet.nome}
                            </Text>
                        </Pressable>
                    ))}

                    <Pressable
                        style={styles.itemPet}
                        onPress={() => navigation.getParent()?.navigate('CadastroPets')}
                    >
                        <View style={[styles.avatarPet, styles.semFoto]}>
                            <Ionicons name="add" size={28} color="#80502D" />
                        </View>
                        <Text style={styles.nomePet}>Adicionar</Text>
                    </Pressable>
                </ScrollView>
            </View>

            {/* configurações */}
            <View style={styles.card}>

                <Text style={styles.textoCard}>Configurações</Text>

                <View style={styles.linhaConfig}>
                    <Ionicons name="eye-outline" size={23} color="#80502D" />

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
                        trackColor={{ false: '#C9C5BE', true: '#D9A567' }}
                        thumbColor="#FFFFFF"
                    />
                </View>

                <Text style={styles.aviso}>
                    Desativado por padrão. Quando ativado, apenas seu nome
                    e um ícone serão exibidos no perfil público dos pets.
                </Text>

                <View style={styles.divisor} />

                <View style={styles.linhaConfig}>
                    <Ionicons name="notifications-outline" size={23} color="#80502D" />

                    <Text style={styles.textoConfig}>
                        Preferência de notificações
                    </Text>

                    <Switch
                        value={perfil.notificacoes}
                        onValueChange={(valor) =>
                            atualizarPerfil({ notificacoes: valor })
                        }
                        trackColor={{ false: '#C9C5BE', true: '#D9A567' }}
                        thumbColor="#FFFFFF"
                    />
                </View>

                <Text style={styles.aviso}>
                    Preferência local. Notificações automáticas ainda
                    não estão implementadas.
                </Text>

                <View style={styles.divisor} />

                <View style={styles.divisor} />

                <Pressable
                    style={styles.linhaConfig}
                    onPress={() => navigation.getParent()?.navigate('ListaPets')}
                >
                    <Ionicons name="paw-outline" size={23} color="#80502D" />
                    <Text style={styles.textoConfig}>Gerenciar meus pets</Text>
                    <Ionicons name="chevron-forward" size={20} color="#80502D" />
                </Pressable>


                <View style={styles.divisor} />

                {/* ajuda e suporte */}
                <Pressable
                    style={styles.linhaConfig}
                    onPress={() => Alert.alert(
                        'Ajuda e suporte',
                        'Para cadastrar um pet, utilize Meus Pets. Para acompanhar alimentação, peso, vacinas e outros cuidados, acesse a aba Meu Pet.'
                    )}
                >
                    <Ionicons
                        name="help-circle-outline"
                        size={23}
                        color="#80502D"
                    />

                    <Text style={styles.textoConfig}>
                        Ajuda e suporte
                    </Text>

                    <Ionicons
                        name="chevron-forward"
                        size={20}
                        color="#80502D"
                    />
                </Pressable>

                <View style={styles.divisor} />

                {/* sobre o aplicativo */}
                <Pressable
                    style={styles.linhaConfig}
                    onPress={() => Alert.alert(
                        'Sobre o Tutus',
                        'O Tutus é um aplicativo acadêmico desenvolvido em React Native para auxiliar tutores na organização e no acompanhamento dos cuidados de seus animais de estimação.\n\nVersão demonstrativa 1.0.'
                    )}
                >
                    <Ionicons
                        name="information-circle-outline"
                        size={23}
                        color="#80502D"
                    />

                    <Text style={styles.textoConfig}>
                        Sobre o Tutus
                    </Text>

                    <Ionicons
                        name="chevron-forward"
                        size={20}
                        color="#80502D"
                    />
                </Pressable>

                <View style={styles.divisor} />

                {/* excluir conta */}
                <Pressable
                    style={styles.linhaConfig}
                    onPress={() => Alert.alert(
                        'Excluir conta',
                        'A exclusão de conta ainda não está disponível nesta versão demonstrativa. Nenhum dado será apagado.'
                    )}
                >
                    <Ionicons
                        name="trash-outline"
                        size={23}
                        color="#A52C2C"
                    />

                    <Text
                        style={[
                            styles.textoConfig,
                            { color: '#A52C2C' }
                        ]}
                    >
                        Excluir conta
                    </Text>

                    <Ionicons
                        name="chevron-forward"
                        size={20}
                        color="#A52C2C"
                    />
                </Pressable>

                <View style={styles.divisor} />

                {/* sair da conta */}
                <Pressable
                    style={styles.linhaConfig}
                    onPress={sairDaConta}
                >
                    <Ionicons
                        name="log-out-outline"
                        size={23}
                        color="#A52C2C"
                    />

                    <Text
                        style={[
                            styles.textoConfig,
                            { color: '#A52C2C' }
                        ]}
                    >
                        Sair da conta
                    </Text>

                    <Ionicons
                        name="chevron-forward"
                        size={20}
                        color="#A52C2C"
                    />
                </Pressable>

            </View>


            {/* JANELA DA ENGRENAGEM */}
            <Modal
                visible={configVisivel}
                animationType="slide"
                onRequestClose={() => setConfigVisivel(false)}
            >
                <ScrollView
                    style={styles.container}
                    contentContainerStyle={styles.conteudoConfig}
                    keyboardShouldPersistTaps="handled"
                >

                    {/* cabeçalho da janela */}
                    <View style={styles.topoConfig}>

                        <Pressable
                            onPress={() => setConfigVisivel(false)}
                            accessibilityLabel="Voltar ao perfil"
                        >
                            <Ionicons
                                name="arrow-back"
                                size={26}
                                color="#332716"
                            />
                        </Pressable>

                        <Text style={styles.tituloConfig}>
                            Informações e Personalização
                        </Text>

                    </View>

                    {/* INFORMAÇÕES DO TUTOR */}
                    <View style={styles.card}>

                        <Text style={styles.textoCard}>
                            Informações do tutor
                        </Text>

                        <Text style={styles.labelCampo}>
                            Nome
                        </Text>

                        <TextInput
                            style={styles.campo}
                            placeholder="Seu nome"
                            placeholderTextColor="#8C8177"
                            value={nomeEdicao}
                            onChangeText={setNomeEdicao}
                            maxLength={60}
                        />

                        <Text style={styles.labelCampo}>
                            E-mail
                        </Text>

                        <TextInput
                            style={styles.campo}
                            placeholder="exemplo@email.com"
                            placeholderTextColor="#8C8177"
                            value={emailEdicao}
                            onChangeText={setEmailEdicao}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        <Text style={styles.labelCampo}>
                            Telefone
                        </Text>

                        <TextInput
                            style={styles.campo}
                            placeholder="(00) 00000-0000"
                            placeholderTextColor="#8C8177"
                            value={telefoneEdicao}
                            onChangeText={setTelefoneEdicao}
                            keyboardType="phone-pad"
                            maxLength={16}
                        />

                        <Pressable
                            style={[
                                styles.botaoEditar,
                                { marginTop: 18 }
                            ]}
                            onPress={salvarDadosConta}
                        >
                            <Text style={styles.textoBotao}>
                                Salvar informações
                            </Text>
                        </Pressable>

                        <Text style={styles.aviso}>
                            Seu e-mail e telefone não serão
                            exibidos no perfil público do pet.
                        </Text>

                    </View>

                    {/* PERSONALIZAÇÃO */}
                    <View style={styles.card}>

                        <Text style={styles.textoCard}>
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
                                color="#80502D"
                            />

                            <Text style={styles.textoConfig}>
                                Padrão Tutus
                            </Text>

                            {perfil.tema === 'padrao' && (
                                <Ionicons
                                    name="checkmark-circle"
                                    size={21}
                                    color="#80502D"
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
                                color="#80502D"
                            />

                            <Text style={styles.textoConfig}>
                                Tons suaves
                            </Text>

                            {perfil.tema === 'suave' && (
                                <Ionicons
                                    name="checkmark-circle"
                                    size={21}
                                    color="#80502D"
                                />
                            )}
                        </Pressable>

                        <Text style={styles.aviso}>
                            Por enquanto, a personalização altera
                            apenas a cor do cabeçalho do Perfil
                            do Tutor. A personalização completa
                            do aplicativo será desenvolvida depois.
                        </Text>

                    </View>

                </ScrollView>
            </Modal>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFDF8',
    },

    conteudo: {
        padding: 25,
        paddingTop: 45,
        paddingBottom: 35,
    },

    titulo: {
        fontFamily: 'Ruwudu-Bold',
        fontSize: 32,
        color: '#332716',
    },

    subtitulo: {
        fontFamily: 'Ruwudu-Regular',
        fontSize: 18,
        color: '#75571F',
        marginBottom: 25,
    },

    card: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#EADFCB',
        borderRadius: 20,
        padding: 18,
        marginBottom: 16,
    },

    textoCard: {
        fontFamily: 'Ruwudu-Bold',
        fontSize: 20,
        color: '#332716',
    },


    cabecalhoPerfil: {
        backgroundColor: '#FFEAC8',
        borderRadius: 24,
        padding: 22,
        alignItems: 'center',
        marginBottom: 20,
    },

    avatarTutor: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#FFFDF8',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },

    nomeTutor: {
        fontFamily: 'Ruwudu-Bold',
        fontSize: 25,
        color: '#332716',
        textAlign: 'center',
    },

    bioTutor: {
        fontFamily: 'Ruwudu-Regular',
        fontSize: 15,
        color: '#75571F',
        textAlign: 'center',
        marginTop: 5,
    },

    contagem: {
        fontSize: 14,
        color: '#80502D',
        marginTop: 10,
        marginBottom: 15,
    },

    botaoEditar: {
        backgroundColor: '#80502D',
        paddingHorizontal: 20,
        paddingVertical: 11,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },

    textoBotao: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: 'bold',
    },

    campo: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#EADFCB',
        borderRadius: 12,
        padding: 12,
        marginTop: 12,
        color: '#332716',
        textAlignVertical: 'top',
    },

    listaPets: {
        gap: 16,
        paddingTop: 15,
    },

    itemPet: {
        alignItems: 'center',
        width: 73,
    },

    avatarPet: {
        width: 58,
        height: 58,
        borderRadius: 29,
    },

    semFoto: {
        backgroundColor: '#FFFDF8',
        justifyContent: 'center',
        alignItems: 'center',
    },

    nomePet: {
        fontSize: 13,
        color: '#332716',
        marginTop: 6,
        textAlign: 'center',
        width: 73,
    },

    linhaConfig: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 13,
    },

    textoConfig: {
        flex: 1,
        fontSize: 15,
        color: '#332716',
    },

    aviso: {
        fontSize: 12,
        color: '#75571F',
        marginBottom: 10,
    },

    divisor: {
        height: 1,
        backgroundColor: '#EADFCB',
        marginVertical: 8,
    },

    botaoSair: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: 16,
    },

    textoSair: {
        color: '#A52C2C',
        fontWeight: 'bold',
        fontSize: 16,
    },

    cancelar: {
        color: '#80502D',
        textAlign: 'center',
        marginTop: 12,
    },

    linhaFotoConfiguracoes: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 15,
        marginBottom: 12,
    },

    engrenagemPerfil: {
        width: 45,
        height: 45,
        borderRadius: 23,
        backgroundColor: '#FFFDF8',
        borderWidth: 1,
        borderColor: '#EADFCB',
        alignItems: 'center',
        justifyContent: 'center',
    },


    conteudoConfig: {
        paddingHorizontal: 20,
        paddingTop: 55,
        paddingBottom: 45,
    },

    topoConfig: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        marginBottom: 25,
    },

    tituloConfig: {
        flex: 1,
        fontFamily: 'Ruwudu-Bold',
        fontSize: 23,
        color: '#332716',
    },

    labelCampo: {
        fontFamily: 'Ruwudu-Regular',
        fontSize: 15,
        color: '#75571F',
        marginTop: 14,
    },

    opcaoTema: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#FFFDF8',
        borderWidth: 1,
        borderColor: '#EADFCB',
        padding: 14,
        borderRadius: 13,
        marginTop: 10,
    },

    opcaoSelecionada: {
        backgroundColor: '#FFEAC8',
        borderColor: '#80502D',
    },

});