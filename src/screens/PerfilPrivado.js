import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable, ScrollView } from 'react-native';
import { Alert } from "../componentes/AlertaTutus";

import RegistrosPet from '../componentes/RegistrosPet';
import VacinasPet from '../componentes/VacinasPet';
import CuidadosPet from '../componentes/CuidadosPet';
import HigienePet from '../componentes/HigienePet';
import AguaPet from '../componentes/AguaPet';

import TelaComTopo from '../componentes/TelaComTopo';
import Cartao from '../componentes/Cartao';
import Botao from '../componentes/Botao';
import Chip from '../componentes/Chip';
import AvatarPet from '../componentes/AvatarPet';
import { cores, fontes, sombra } from '../styles/tema';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { useSQLiteContext } from 'expo-sqlite';
import { buscarPet, obterPetSelecionadoId } from '../database/Database';
import { useFocusEffect } from '@react-navigation/native';
import { categoriaPermitida } from '../utils/categoriasPet';

export default function PerfilPrivado({ navigation }) {

    const CATEGORIAS = [
        { id: 'alimentacao', nome: 'Alimentação', icone: 'bone'},
        { id: 'agua', nome: 'Água', icone: 'water' },
        { id: 'peso', nome: 'Peso', icone: 'scale-bathroom' },
        { id: 'vacinas', nome: 'Vacinas', icone: 'needle' },
        { id: 'consulta', nome: 'Consultas', icone: 'calendar-outline' },
        { id: 'medicamento', nome: 'Remédios', icone: 'pill' },
        { id: 'higiene', nome: 'Higiene', icone: 'shower-head' },
    ]; 

    const db = useSQLiteContext();

    const [pet, setPet] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [categoria, setCategoria] = useState('alimentacao');

    useFocusEffect(
        useCallback(() => {
            let ativo = true;

            async function carregarPet() {
                if (ativo) setCarregando(true);

                try {
                    const idSelecionado = await obterPetSelecionadoId(db);

                    const petEncontrado = idSelecionado
                        ? await buscarPet(db, idSelecionado)
                        : null;

                    if (ativo) {
                        setPet(petEncontrado || null);

                    setCategoria(anterior =>
                        categoriaPermitida(petEncontrado?.especie, anterior)
                            ? anterior
                            : 'alimentacao'
                    );

                    }

                } catch (erro) {
                    console.error("Erro ao carregar pet:", erro);

                    if (ativo) {
                        setPet(null);
                        Alert.alert(
                            "Erro",
                            "Não foi possível carregar os dados do pet."
                        );
                    }
                } finally {
                    if (ativo) setCarregando(false);
                }
            }

            carregarPet();

            return () => {
                ativo = false;
            };

        }, [db])
    );

    return (
        <TelaComTopo
            centro={
                pet ? (
                    <Pressable
                        onPress={() => navigation.getParent()?.navigate('CadastroPets', { petParaEditar: pet })}
                        accessibilityRole="button"
                        accessibilityLabel="Editar foto e dados do pet"
                        style={({ pressed }) => [styles.fotoTopo, pressed && styles.pressionado]}
                    >
                        <AvatarPet foto={pet.foto_perfil} tamanho={100}  />

                        <View style={styles.badgeFoto}>
                            <Ionicons name="camera" size={14} color={cores.fundo} />
                        </View>
                    </Pressable>
                ) : (
                    <View style={styles.avatarTopo}>
                        <Ionicons name="paw" size={38} color={cores.laranja} />
                    </View>
                )
            }
        >

            <Text style={styles.tituloTela}>Meu Pet</Text>

            {carregando ? (
                <View style={styles.carregando}>
                    <ActivityIndicator color={cores.laranja} size="large" />
                    <Text style={styles.textoCarregando}>
                        Carregando informações...
                    </Text>
                </View>
            ) : pet ? (

                <View style={styles.heroi}>

                    <View style={styles.heroiAnel} />

                    <View style={styles.heroiLinha}>

                        <View style={styles.heroiTextos}>
                            <Text style={styles.heroiRotulo}>SEU COMPANHEIRO</Text>

                            <Text style={styles.nomePet} numberOfLines={1}>
                                {pet.nome}
                            </Text>

                            <Text style={styles.heroiDetalhe} numberOfLines={1}>
                                {pet.especie}{pet.raca ? ` • ${pet.raca}` : ''}
                            </Text>
                        </View>

                        <Pressable
                            onPress={() => navigation.getParent()?.navigate("ListaPets")}
                            accessibilityRole="button"
                            accessibilityLabel="Trocar de pet"
                            hitSlop={8}
                            style={({ pressed }) => [styles.botaoTrocar, pressed && styles.pressionado]}
                        >
                            <Ionicons name="swap-horizontal" size={22} color={cores.marrom} />
                        </Pressable>

                    </View>

                    <View style={styles.numeros}>

                        <View style={styles.numeroBloco}>
                            <View style={styles.numeroBola}>
                                <Ionicons name="calendar-outline" size={18} color={cores.marrom} />
                            </View>
                            <View style={styles.numeroTextos}>
                                <Text style={styles.numeroValor} numberOfLines={1}>
                                    {pet.data_nascimento || pet.idade_Aproximada || '—'}
                                </Text>
                                <Text style={styles.numeroLegenda}>
                                    {pet.data_nascimento ? 'nascimento' : 'idade'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.numeroBloco}>
                            <View style={[styles.numeroBola, styles.numeroBolaEscura]}>
                                <Ionicons name="paw" size={18} color={cores.laranjaClaro} />
                            </View>
                            <View style={styles.numeroTextos}>
                                <Text style={styles.numeroValor} numberOfLines={1}>
                                    {pet.raca || '—'}
                                </Text>
                                <Text style={styles.numeroLegenda}>raça</Text>
                            </View>
                        </View>

                    </View>

                    {pet.observacoes || (pet.data_especial && !pet.data_nascimento) ? (
                        <View style={styles.detalhes}>

                            {pet.data_especial && !pet.data_nascimento ? (
                                <View style={styles.linhaDetalhe}>
                                    <Ionicons name="gift-outline" size={16} color={cores.laranja} style={styles.iconeDetalhe} />
                                    <Text style={styles.textoDetalhe}>
                                        Dia especial:{' '}
                                        <Text style={styles.textoDetalheForte}>
                                            {pet.data_especial.slice(0, 5)}
                                        </Text>
                                    </Text>
                                </View>
                            ) : null}

                            {pet.observacoes ? (
                                <View style={styles.linhaDetalhe}>
                                    <Ionicons name="document-text-outline" size={16} color={cores.laranja} style={styles.iconeDetalhe} />
                                    <Text style={styles.textoDetalhe}>
                                        {pet.observacoes}
                                    </Text>
                                </View>
                            ) : null}

                        </View>
                    ) : null}

                </View>

            ) : (

                <View style={styles.vazio}>
                    <Text style={styles.textoVazio}>
                        Nenhum pet selecionado
                    </Text>

                    <Botao
                        titulo="Escolher pet"
                        onPress={() => navigation.getParent()?.navigate("ListaPets")}
                    />
                </View>

            )}

            {pet && !carregando && (
                <>
                    {/* Menu horizontal de categorias */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={{ flexGrow: 0 }}
                        contentContainerStyle={styles.menuCategorias}
                    >
                        {CATEGORIAS.filter(item => categoriaPermitida(pet.especie, item.id)).map(item => {
                            const ativo = categoria === item.id;

                            return (
                                <Pressable
                                    key={item.id}
                                    onPress={() => setCategoria(item.id)}
                                    accessibilityRole="button"
                                    accessibilityState={{ selected: ativo }}
                                    style={[
                                        styles.categoria,
                                        ativo && styles.categoriaAtiva
                                    ]}
                                >
                                    <View style={styles.categoriaTopo}>
                                        <MaterialCommunityIcons
                                            name={item.icone}
                                            size={28}
                                            color={cores.marrom}
                                        />

                                        {ativo && (
                                            <Ionicons
                                                name="checkmark-circle"
                                                size={16}
                                                color={cores.marrom}
                                            />
                                        )}
                                    </View>

                                    <Text style={styles.categoriaTexto}>
                                        {item.nome}
                                    </Text>

                                </Pressable>
                            );
                        })}
                    </ScrollView>

                    {/* Exibe apenas a categoria selecionada */}
                    {(categoria === 'alimentacao' || categoria === 'peso') && (
                        <RegistrosPet
                            key={`${pet.id_pet}-${categoria}`}
                            tipo={categoria}
                        />
                    )}

                    {categoria === 'agua' && categoriaPermitida(pet.especie, 'agua') && (                        <AguaPet key={pet.id_pet} />
                    )}

                    {categoria === 'vacinas' && (
                        <VacinasPet key={pet.id_pet} />
                    )}

                    {categoria === 'consulta' && (
                        <CuidadosPet key={`${pet.id_pet}-consulta`} tipo="consulta" />
                    )}

                    {categoria === 'medicamento' && (
                        <CuidadosPet key={`${pet.id_pet}-medicamento`} tipo="medicamento" />
                    )}

                    {categoria === 'higiene' && (
                        <HigienePet key={pet.id_pet} pet={pet} />
                    )}
                </>
            )}
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

    fotoTopo: {
        width: 100,
        height: 100,
        borderRadius: 55,
        backgroundColor: cores.fundo,
        ...sombra,
    },

    badgeFoto: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: cores.laranja,
        borderWidth: 2,
        borderColor: cores.fundo,
        alignItems: 'center',
        justifyContent: 'center',
    },

    avatarTopo: {
        width: 95,
        height: 95,
        borderRadius: 47.5,
        backgroundColor: cores.marrom,
        borderWidth: 4,
        borderColor: '#201604',
        justifyContent: 'center',
        alignItems: 'center',
        ...sombra,
    },

    carregando: {
        alignItems: 'center',
        gap: 10,
        paddingVertical: 30,
    },

    textoCarregando: {
        fontFamily: fontes.regular,
        fontSize: 16,
        color: cores.marromClaro,
    },

    heroi: {
        backgroundColor: cores.marrom,
        borderRadius: 30,
        padding: 16,
        marginBottom: 8,
        overflow: 'hidden',
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

    nomePet: {
        fontFamily: fontes.negrito,
        fontSize: 26,
        lineHeight: 34,
        color: cores.laranjaClaro,
    },

    heroiDetalhe: {
        fontFamily: fontes.regular,
        fontSize: 15,
        lineHeight: 21,
        color: 'rgba(255, 234, 200, 0.72)',
    },

    botaoTrocar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: cores.laranja,
        alignItems: 'center',
        justifyContent: 'center',
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

    numeroTextos: {
        flex: 1,
        minWidth: 0,
    },

    numeroValor: {
        fontFamily: fontes.negrito,
        fontSize: 16,
        lineHeight: 22,
        color: cores.marrom,
    },

    numeroLegenda: {
        fontFamily: fontes.regular,
        fontSize: 12,
        lineHeight: 16,
        color: cores.marromClaro,
    },

    observacoes: {
        fontFamily: fontes.regular,
        fontSize: 14,
        lineHeight: 20,
        color: 'rgba(255, 234, 200, 0.72)',
        marginTop: 12,
    },

    detalhes: {
        marginTop: 12,
        backgroundColor: 'rgba(255, 234, 200, 0.08)',
        borderRadius: 18,
        padding: 12,
        gap: 8,
    },

    linhaDetalhe: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },

    iconeDetalhe: {
        marginTop: 2,
    },

    textoDetalhe: {
        flex: 1,
        fontFamily: fontes.regular,
        fontSize: 14,
        lineHeight: 20,
        color: 'rgba(255, 234, 200, 0.85)',
    },

    textoDetalheForte: {
        fontFamily: fontes.negrito,
        color: cores.laranjaClaro,
    },

    // sem pet
    vazio: {
        alignItems: 'center',
        backgroundColor: cores.branco,
        borderRadius: 25,
        paddingVertical: 22,
        paddingHorizontal: 16,
        marginBottom: 8,
        ...sombra,
    },

    textoVazio: {
        fontFamily: fontes.regular,
        fontSize: 17,
        lineHeight: 24,
        color: cores.marromClaro,
    },

    pressionado: {
        opacity: 0.7,
        transform: [{ scale: 0.95 }],
    },

    menuCategorias: {
        flexDirection: 'row',
        gap: 10,
        paddingVertical: 12,
    },

    categoria: {
        width: 112,
        height: 90,
        backgroundColor: cores.branco,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: '#E9DFD2',
        padding: 12,
        justifyContent: 'space-between',
    },

    categoriaAtiva: {
        backgroundColor: cores.laranja,
        borderColor: cores.laranja,
    },

    categoriaTopo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },

    categoriaTexto: {
        fontFamily: fontes.negrito,
        fontSize: 15,
        color: cores.marrom,
    },   
});