
import React, { useState, useCallback } from 'react';

import { View, Text, TextInput, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import { Alert } from "./AlertaTutus";

import { useSQLiteContext } from 'expo-sqlite';
import {
    obterPetSelecionadoId,
    listarVacinas,
    inserirVacina,
    alterarStatusVacina,
    removerVacina
} from '../database/Database';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { cores, fontes, sombra } from '../styles/tema';

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
    const db = useSQLiteContext();

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
                    const id = await obterPetSelecionadoId(db);

                    const lista = id
                        ? await listarVacinas(db, id)
                        : [];

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
        }, [db])
    );

    // salva a lista de vacinas no dispositivo
    async function salvarLista(novaLista, acao) {
        if (!petId || salvando) return false;

        setSalvando(true);

        try {
            await acao();

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

        const sucesso = await salvarLista(
            [novaVacina, ...vacinas],
            () => inserirVacina(db, petId, novaVacina)
        );

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

        await salvarLista(
            lista,
            () => alterarStatusVacina(db, vacina.id, !vacina.aplicada)
        );
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

                        await salvarLista(
                            lista,
                            () => removerVacina(db, id)
                        );
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

    // situação de cada vacina: aplicada, atrasada ou pendente
    function situacao(vacina) {
        if (vacina.aplicada) {
            return { texto: 'Aplicada', fundo: 'rgba(51, 39, 22, 0.08)', cor: cores.marromClaro };
        }

        const [dia, mes, ano] = vacina.data.split('/').map(Number);
        const dataVacina = new Date(ano, mes - 1, dia);
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        if (dataVacina < hoje) {
            return { texto: 'Atrasada', fundo: cores.erro, cor: cores.fundo };
        }

        return { texto: 'Pendente', fundo: cores.laranja, cor: cores.marrom };
    }

    return (
        <>
            <Text style={styles.tituloSecao}>Vacinas</Text>

            {/* formulário */}
            <View style={styles.card}>

                <TextInput
                    style={styles.campo}
                    placeholder="Nome da vacina (ex.: V4, antirrábica)"
                    placeholderTextColor="#A89A82"
                    value={nome}
                    onChangeText={setNome}
                />

                <View style={styles.linha}>
                    <TextInput
                        style={[styles.campo, styles.campoData]}
                        placeholder="DD/MM/AAAA"
                        placeholderTextColor="#A89A82"
                        value={data}
                        onChangeText={(texto) => setData(formatarData(texto))}
                        keyboardType="numeric"
                        maxLength={10}
                    />

                    <Pressable
                        onPress={adicionarVacina}
                        disabled={salvando}
                        accessibilityRole="button"
                        style={({ pressed }) => [
                            styles.botao,
                            styles.botaoLinha,
                            (pressed || salvando) && styles.pressionado
                        ]}
                    >
                        <Ionicons name="add" size={20} color={cores.marrom} />
                        <Text style={styles.botaoTexto}>Adicionar</Text>
                    </Pressable>
                </View>

            </View>

            {/* lista */}
            {vacinas.length === 0 ? (
                <Text style={styles.vazio}>
                    Sem vacinas registradas no momento
                </Text>
            ) : (
                vacinas.map(vacina => {

                    const s = situacao(vacina);

                    return (
                        <View key={vacina.id} style={styles.item}>

                            {/* tocar na bolinha marca como aplicada / pendente */}
                            <Pressable
                                onPress={() => alterarStatus(vacina)}
                                disabled={salvando}
                                accessibilityRole="button"
                                accessibilityLabel={vacina.aplicada ? 'Marcar como pendente' : 'Marcar como aplicada'}
                                style={({ pressed }) => [
                                    styles.bola,
                                    vacina.aplicada && styles.bolaFeita,
                                    pressed && styles.pressionado
                                ]}
                            >
                                <Ionicons
                                    name={vacina.aplicada ? 'checkmark' : 'medkit-outline'}
                                    size={20}
                                    color={cores.marrom}
                                />
                            </Pressable>

                            <View style={styles.textos}>
                                <Text
                                    style={[styles.nome, vacina.aplicada && styles.nomeFeito]}
                                    numberOfLines={1}
                                >
                                    {vacina.nome}
                                </Text>
                                <Text style={styles.informacao}>{vacina.data}</Text>
                            </View>

                            <View style={[styles.selo, { backgroundColor: s.fundo }]}>
                                <Text style={[styles.seloTexto, { color: s.cor }]}>{s.texto}</Text>
                            </View>

                            <Pressable
                                onPress={() => excluirVacina(vacina.id)}
                                disabled={salvando}
                                hitSlop={8}
                                accessibilityRole="button"
                                accessibilityLabel="Excluir vacina"
                                style={({ pressed }) => [styles.iconeAcao, pressed && styles.pressionado]}
                            >
                                <Ionicons name="trash-outline" size={19} color={cores.erro} />
                            </Pressable>

                        </View>
                    );
                })
            )}

            {vacinas.length > 0 ? (
                <Text style={styles.dica}>
                    Toque na bolinha para marcar como aplicada
                </Text>
            ) : null}
        </>
    );
}

const styles = StyleSheet.create({
  tituloSecao: {
    fontFamily: fontes.negrito,
    fontSize: 24,
    lineHeight: 32,
    color: cores.marrom,
    marginTop: 22,
    marginBottom: 10,
  },

  card: {
    backgroundColor: cores.branco,
    borderRadius: 25,
    padding: 14,
    marginBottom: 10,
    ...sombra,
  },

  campo: {
    height: 50,
    backgroundColor: cores.branco,
    borderWidth: 1.5,
    borderColor: cores.laranja,
    borderRadius: 15,
    paddingHorizontal: 14,
    fontFamily: fontes.regular,
    fontSize: 16,
    color: cores.marrom,
    marginBottom: 10,
  },

  campoGrande: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },

  botao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    borderRadius: 24,
    backgroundColor: cores.laranja,
  },

  botaoTexto: {
    fontFamily: fontes.negrito,
    fontSize: 17,
    color: cores.marrom,
  },

  link: {
    fontFamily: fontes.negrito,
    fontSize: 15,
    color: cores.marromClaro,
    textAlign: 'center',
    marginTop: 10,
  },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: cores.branco,
    borderRadius: 22,
    paddingVertical: 11,
    paddingLeft: 11,
    paddingRight: 8,
    marginBottom: 10,
    ...sombra,
  },

  bola: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: cores.laranja,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bolaEscura: {
    backgroundColor: cores.marrom,
  },

  bolaFeita: {
    backgroundColor: 'rgba(51, 39, 22, 0.08)',
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

  nomeFeito: {
    color: cores.marromClaro,
    textDecorationLine: 'line-through',
  },

  informacao: {
    fontFamily: fontes.regular,
    fontSize: 13,
    lineHeight: 18,
    color: cores.marromClaro,
  },

  selo: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },

  seloTexto: {
    fontFamily: fontes.negrito,
    fontSize: 12,
    lineHeight: 18,
  },

  iconeAcao: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },

  vazio: {
    fontFamily: fontes.regular,
    fontSize: 15,
    lineHeight: 22,
    color: cores.marromClaro,
    textAlign: 'center',
    paddingVertical: 10,
  },

  aviso: {
    fontFamily: fontes.regular,
    fontSize: 15,
    color: cores.marromClaro,
    marginVertical: 10,
  },

  pressionado: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },

  
  linha: {
    flexDirection: 'row',
    gap: 10,
  },

  campoData: {
    flex: 1,
    marginBottom: 0,
  },

  botaoLinha: {
    height: 50,
    paddingHorizontal: 16,
  },

  dica: {
    fontFamily: fontes.regular,
    fontSize: 13,
    color: cores.marromClaro,
    textAlign: 'center',
    marginBottom: 6,
  },
});