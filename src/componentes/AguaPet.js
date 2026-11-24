import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Alert } from "./AlertaTutus";
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { cores, fontes, sombra } from '../styles/tema';

import { obterPetSelecionadoId, listarRegistros, inserirRegistro, removerRegistro } from '../database/Database';

function quandoRegistro(texto) {
    const d = new Date(texto);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const hora = String(d.getHours()).padStart(2, '0');
    const minuto = String(d.getMinutes()).padStart(2, '0');

    return `${dia}/${mes} • ${hora}:${minuto}`;
}

export default function AguaPet() {
    const db = useSQLiteContext();

    const [petId, setPetId] = useState(null);
    const [registros, setRegistros] = useState([]);
    const [quantidade, setQuantidade] = useState('');
    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [historicoAberto, setHistoricoAberto] = useState(false);

    const atalhos = ['100', '200', '300', '500'];

    useFocusEffect(
        useCallback(() => {
            let ativo = true;

            async function carregar() {
                setCarregando(true);

                try {
                    const id = await obterPetSelecionadoId(db);
                    const dados = id ? await listarRegistros(db, id) : null;

                    if (ativo) {
                        setPetId(id);
                        setRegistros(dados?.agua || []);
                        setQuantidade('');
                    }
                } catch (erro) {
                    console.error('Erro ao carregar água:', erro);

                    if (ativo) {
                        setPetId(null);
                        setRegistros([]);
                        Alert.alert('Erro', 'Não foi possível carregar os registros.');
                    }
                } finally {
                    if (ativo) setCarregando(false);
                }
            }

            carregar();

            return () => {
                ativo = false;
            };
        }, [db])
    );

    async function salvarAgua() {
        if (!petId || salvando) return;

        const entrada = quantidade.trim().replace(',', '.');
        const numero = Number(entrada);

        if (!/^\d+(\.\d{1,2})?$/.test(entrada) || !Number.isFinite(numero) || numero <= 0) {
            Alert.alert('Valor inválido', 'Informe uma quantidade maior que zero.');
            return;
        }

        const novo = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            valor: numero,
            data: new Date().toISOString(),
        };

        setSalvando(true);

        try {
            await inserirRegistro(db, petId, 'agua', novo);

            setRegistros(atual => [novo, ...atual]);
            setQuantidade('');

        } catch (erro) {
            console.error('Erro ao registrar água:', erro);
            Alert.alert('Erro', 'Não foi possível salvar o registro.');
        } finally {
            setSalvando(false);
        }
    }

    function confirmarExclusao(id) {
        Alert.alert(
            'Excluir registro?',
            'Essa ação não pode ser desfeita.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        if (salvando) return;

                        setSalvando(true);

                        try {
                            await removerRegistro(db, id);

                            setRegistros(atual => atual.filter(item => item.id !== id));

                        } catch (erro) {
                            Alert.alert('Erro', 'Não foi possível excluir o registro.');
                        } finally {
                            setSalvando(false);
                        }
                    },
                },
            ]
        );
    }

    const hoje = new Date().toDateString();

    const totalHoje = registros
        .filter(item => new Date(item.data).toDateString() === hoje)
        .reduce((total, item) => total + Number(item.valor), 0);

    if (carregando) {
        return <Text style={styles.mensagem}>Carregando registros...</Text>;
    }

    if (!petId) {
        return <Text style={styles.mensagem}>Selecione um pet para registrar a água.</Text>;
    }

    return (
        <View style={styles.card}>

            <View style={styles.resumo}>
                <Text style={styles.resumoTitulo}>Água oferecida hoje</Text>
                <Text style={styles.resumoValor}>
                    {totalHoje.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} ml
                </Text>

                <Text style={styles.informacao}>
                    {registros.length > 0
                        ? `Última reposição: ${quandoRegistro(registros[0].data)}`
                        : 'Nenhuma reposição registrada'}
                </Text>
            </View>

            <View style={styles.linhaFormulario}>

                <View style={styles.bola}>
                    <Ionicons name="water-outline" size={22} color={cores.marrom} />
                </View>

                <View style={styles.campoCaixa}>
                    <TextInput
                        style={styles.campoNumero}
                        value={quantidade}
                        onChangeText={setQuantidade}
                        placeholder="Quanto repôs?"
                        placeholderTextColor="#A89A82"
                        keyboardType="decimal-pad"
                    />
                    <Text style={styles.unidade}>ml</Text>
                </View>

                <Pressable
                    style={[styles.botaoRedondo, salvando && styles.pressionado]}
                    onPress={salvarAgua}
                    disabled={salvando}
                    accessibilityRole="button"
                    accessibilityLabel="Registrar água"
                >
                    <Ionicons name="checkmark" size={24} color={cores.marrom} />
                </Pressable>

            </View>

            <View style={styles.atalhos}>
                {atalhos.map(valor => (
                    <Pressable
                        key={valor}
                        onPress={() => setQuantidade(valor)}
                        style={[styles.atalho, quantidade === valor && styles.atalhoAtivo]}
                    >
                        <Text style={[styles.atalhoTexto, quantidade === valor && styles.atalhoTextoAtivo]}>
                            {valor} ml
                        </Text>
                    </Pressable>
                ))}
            </View>

            <Pressable
                style={styles.botaoHistorico}
                onPress={() => setHistoricoAberto(anterior => !anterior)}
                accessibilityRole="button"
                accessibilityState={{ expanded: historicoAberto }}
            >
                <Ionicons name="time-outline" size={20} color="#9A8A75" />

                <Text style={styles.textoHistorico}>
                    Histórico ({registros.length})
                </Text>

                <Ionicons
                    name={historicoAberto ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#9A8A75"
                />
            </Pressable>

            {historicoAberto && registros.length === 0 && (
                <Text style={styles.vazio}>Nenhum registro encontrado.</Text>
            )}

            {historicoAberto && registros.map(registro => (
                <View key={registro.id} style={styles.item}>

                    <View style={styles.textos}>
                        <Text style={styles.nome}>
                            {String(registro.valor).replace('.', ',')} ml
                        </Text>

                        <Text style={styles.informacao}>
                            {quandoRegistro(registro.data)}
                        </Text>
                    </View>

                    <Pressable
                        onPress={() => confirmarExclusao(registro.id)}
                        disabled={salvando}
                        hitSlop={8}
                        accessibilityLabel="Excluir registro de água"
                    >
                        <Ionicons name="trash-outline" size={19} color={cores.erro} />
                    </Pressable>

                </View>
            ))}

        </View>
    );
}

const styles = StyleSheet.create({

    card: {
        backgroundColor: cores.branco,
        borderRadius: 25,
        padding: 14,
        marginBottom: 10,
        ...sombra,
    },

    resumo: {
        backgroundColor: 'rgba(250, 159, 42, 0.10)',
        borderRadius: 18,
        padding: 14,
        marginBottom: 14,
        alignItems: 'center',
    },

    resumoTitulo: {
        fontFamily: fontes.regular,
        fontSize: 15,
        color: cores.marromClaro,
    },

    resumoValor: {
        fontFamily: fontes.negrito,
        fontSize: 30,
        lineHeight: 38,
        color: cores.marrom,
    },

    linhaFormulario: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },

    bola: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: cores.laranja,
        alignItems: 'center',
        justifyContent: 'center',
    },

    campoCaixa: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        height: 48,
        borderWidth: 1.5,
        borderColor: cores.laranja,
        borderRadius: 15,
        paddingHorizontal: 12,
    },

    campoNumero: {
        flex: 1,
        fontFamily: fontes.regular,
        fontSize: 16,
        color: cores.marrom,
    },

    unidade: {
        fontFamily: fontes.negrito,
        fontSize: 15,
        color: cores.marromClaro,
    },

    botaoRedondo: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: cores.laranja,
        alignItems: 'center',
        justifyContent: 'center',
    },

    atalhos: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
    },

    atalho: {
        flex: 1,
        alignItems: 'center',
        borderRadius: 16,
        paddingVertical: 4,
        backgroundColor: 'rgba(51, 39, 22, 0.06)',
    },

    atalhoAtivo: {
        backgroundColor: cores.laranja,
    },

    atalhoTexto: {
        fontFamily: fontes.negrito,
        fontSize: 14,
        lineHeight: 26,
        color: cores.marromClaro,
    },

    atalhoTextoAtivo: {
        color: cores.marrom,
    },

    botaoHistorico: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        borderTopWidth: 1,
        borderTopColor: '#E9E1D6',
        paddingTop: 12,
        gap: 8,
        marginTop: 14,
    },

    textoHistorico: {
        flex: 1,
        fontFamily: fontes.regular,
        fontSize: 15,
        color: '#9A8A75',
    },

    item: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 11,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E9E1D6',
    },

    textos: {
        flex: 1,
        minWidth: 0,
    },

    nome: {
        fontFamily: fontes.negrito,
        fontSize: 16,
        lineHeight: 22,
        color: cores.marrom,
    },

    informacao: {
        fontFamily: fontes.regular,
        fontSize: 13,
        lineHeight: 18,
        color: cores.marromClaro,
    },

    vazio: {
        fontFamily: fontes.regular,
        fontSize: 15,
        color: cores.marromClaro,
        textAlign: 'center',
        paddingVertical: 10,
    },

    mensagem: {
        fontFamily: fontes.regular,
        color: cores.marromClaro,
        fontSize: 15,
        marginVertical: 15,
    },

    pressionado: {
        opacity: 0.7,
        transform: [{ scale: 0.97 }],
    },

});