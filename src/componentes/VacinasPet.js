
import React, { useState, useCallback } from 'react';

import {
    View, Text, TextInput, TouchableOpacity, Alert, StyleSheet
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

// formata automaticamente a data
function formatarData(texto) {
    const numeros = texto.replace(/\D/g, '').slice(0, 8);

    if (numeros.length > 4) {
        return `${numeros.slice(0, 2)}/${numeros.slice(2, 4)}/${numeros.slice(4)}`;
    }

    if (numeros.length > 2) {
        return `${numeros.slice(0, 2)}/${numeros.slice(2)}`;
    }

    return numeros;
}

// verifica se a data existe realmente
function validarData(valor) {
    const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(valor);

    if (!partes) return false;

    const dia = Number(partes[1]);
    const mes = Number(partes[2]);
    const ano = Number(partes[3]);

    if (ano < 1900 || ano > 2100) return false;

    const data = new Date(ano, mes - 1, dia);

    return (
        data.getFullYear() === ano &&
        data.getMonth() === mes - 1 &&
        data.getDate() === dia
    );
}

export default function VacinasPet() {
    const [petId, setPetId] = useState(null);
    const [vacinas, setVacinas] = useState([]);
    const [nome, setNome] = useState('');
    const [data, setData] = useState('');
    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);

    // carrega as vacinas do pet 
    useFocusEffect(
        useCallback(() => {
            let ativo = true;

            async function carregarVacinas() {
                if (ativo) setCarregando(true);

                try {
                    const id = await AsyncStorage.getItem(
                        '@tutus:petSelecionadoId'
                    );

                    const dados = id
                        ? await AsyncStorage.getItem(`@tutus:vacinas:${id}`)
                        : null;

                    const lista = dados ? JSON.parse(dados) : [];

                    if (!Array.isArray(lista)) {
                        throw new Error('Dados inválidos');
                    }

                    if (ativo) {
                        setPetId(id);
                        setVacinas(lista);
                        setNome('');
                        setData('');
                    }

                } catch (erro) {
                    console.error('Erro ao carregar vacinas:', erro);

                    if (ativo) {
                        setPetId(null);
                        setVacinas([]);

                        Alert.alert(
                            'Erro',
                            'Não foi possível carregar as vacinas.'
                        );
                    }

                } finally {
                    if (ativo) setCarregando(false);
                }
            }

            carregarVacinas();

            return () => {
                ativo = false;
            };
        }, [])
    );

    // salva a lista de vacinas no dispositivo
    async function salvarLista(novaLista) {
        if (!petId || salvando) return false;

        setSalvando(true);

        try {
            await AsyncStorage.setItem(
                `@tutus:vacinas:${petId}`,
                JSON.stringify(novaLista)
            );

            setVacinas(novaLista);
            return true;

        } catch (erro) {
            console.error('Erro ao salvar vacinas:', erro);

            Alert.alert(
                'Erro',
                'Não foi possível salvar as informações.'
            );

            return false;

        } finally {
            setSalvando(false);
        }
    }

    // cadastra uma nova vacina
    async function adicionarVacina() {
        if (!nome.trim()) {
            Alert.alert('Atenção', 'Informe o nome da vacina.');
            return;
        }

        if (!validarData(data.trim())) {
            Alert.alert(
                'Data inválida',
                'Informe uma data válida no formato DD/MM/AAAA.'
            );
            return;
        }

        const novaVacina = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            nome: nome.trim(),
            data: data.trim(),
            aplicada: false
        };

        const sucesso = await salvarLista([
            novaVacina,
            ...vacinas
        ]);

        if (sucesso) {
            setNome('');
            setData('');
            Alert.alert('Sucesso', 'Vacina cadastrada!');
        }
    }

    // atualiza o status da vacina
    async function alterarStatus(vacina) {
        const lista = vacinas.map(item =>
            item.id === vacina.id
                ? { ...item, aplicada: !item.aplicada }
                : item
        );

        await salvarLista(lista);
    }

    // exclui uma vacina
    function excluirVacina(id) {
        Alert.alert(
            'Excluir vacina?',
            'Deseja realmente excluir esse registro?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        const lista = vacinas.filter(
                            item => item.id !== id
                        );

                        await salvarLista(lista);
                    }
                }
            ]
        );
    }

    if (carregando) {
        return <Text>Carregando vacinas...</Text>;
    }

    if (!petId) {
        return (
            <Text style={styles.aviso}>
                Selecione um pet para registrar vacinas.
            </Text>
        );
    }

    return (
        <View style={styles.container}>

            <Text style={styles.titulo}>
                Vacinas e lembretes
            </Text>

            <TextInput
                style={styles.campo}
                placeholder="Nome da vacina"
                placeholderTextColor="#8C8177"
                value={nome}
                onChangeText={setNome}
            />

            <TextInput
                style={styles.campo}
                placeholder="DD/MM/AAAA"
                placeholderTextColor="#8C8177"
                value={data}
                onChangeText={(texto) => setData(formatarData(texto))}
                keyboardType="numeric"
                maxLength={10}
            />

            <TouchableOpacity
                style={styles.botao}
                onPress={adicionarVacina}
                disabled={salvando}
            >
                <Text style={styles.textoBotao}>
                    + Adicionar Vacina
                </Text>
            </TouchableOpacity>

            <Text style={styles.subtitulo}>
                Vacinas cadastradas
            </Text>

            {vacinas.length === 0 ? (
                <Text style={styles.aviso}>
                    Nenhuma vacina cadastrada.
                </Text>
            ) : (
                vacinas.map(vacina => (
                    <View key={vacina.id} style={styles.card}>

                        <Text style={styles.nome}>
                            {vacina.nome}
                        </Text>

                        <Text style={styles.informacao}>
                            Data: {vacina.data}
                        </Text>

                        <Text style={styles.informacao}>
                            Status: {vacina.aplicada
                                ? 'Aplicada'
                                : 'Pendente'}
                        </Text>

                        <TouchableOpacity
                            onPress={() => alterarStatus(vacina)}
                            disabled={salvando}
                        >
                            <Text style={styles.acao}>
                                {vacina.aplicada
                                    ? 'Marcar como pendente'
                                    : 'Marcar como aplicada'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => excluirVacina(vacina.id)}
                            disabled={salvando}
                        >
                            <Text style={styles.excluir}>
                                Excluir vacina
                            </Text>
                        </TouchableOpacity>

                    </View>
                ))
            )}

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#FA9F2A',
        padding: 18,
        marginBottom: 15
    },

    titulo: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#332716',
        marginBottom: 15
    },

    subtitulo: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#332716',
        marginVertical: 15
    },

    campo: {
        borderWidth: 1,
        borderColor: '#CDBDA9',
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
        color: '#332716'
    },

    botao: {
        backgroundColor: '#80502D',
        padding: 14,
        borderRadius: 12,
        alignItems: 'center'
    },

    textoBotao: {
        color: '#FFFFFF',
        fontWeight: 'bold'
    },

    card: {
        borderTopWidth: 1,
        borderTopColor: '#EFE6DD',
        paddingVertical: 12
    },

    nome: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#332716'
    },

    informacao: {
        color: '#75571F',
        marginTop: 5
    },

    acao: {
        color: '#80502D',
        fontWeight: 'bold',
        marginTop: 12
    },

    excluir: {
        color: '#A52C2C',
        marginTop: 12
    },

    aviso: {
        color: '#75571F',
        marginVertical: 10
    }
});
