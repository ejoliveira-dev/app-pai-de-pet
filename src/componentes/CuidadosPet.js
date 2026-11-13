import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import { Alert } from "./AlertaTutus";

import { useSQLiteContext } from 'expo-sqlite';
import {
  obterPetSelecionadoId,
  listarCuidados,
  inserirCuidado,
  atualizarCuidado,
  alterarStatusCuidado,
  removerCuidado
} from '../database/Database';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { cores, fontes, sombra } from '../styles/tema';

// coloca as barras automaticamente na data
function formatarData(texto) {
  const n = texto.replace(/\D/g, '').slice(0, 8);

  if (n.length > 4) {
    return `${n.slice(0, 2)}/${n.slice(2, 4)}/${n.slice(4)}`;
  }
  if (n.length > 2) {
    return `${n.slice(0, 2)}/${n.slice(2)}`;
  }
  return n;
}

// verifica se a data existe
function dataValida(texto) {
  const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto);
  if (!partes) return false;

  const dia = Number(partes[1]);
  const mes = Number(partes[2]);
  const ano = Number(partes[3]);

  if (ano < 1900 || ano > 2100) return false;

  const data = new Date(ano, mes - 1, dia);

  return data.getFullYear() === ano &&
    data.getMonth() === mes - 1 &&
    data.getDate() === dia;
}

export default function CuidadosPet({ tipo }) {
  const db = useSQLiteContext();
  const consulta = tipo === 'consulta';

  const [petId, setPetId] = useState(null);
  const [registros, setRegistros] = useState([]);
  const [nome, setNome] = useState('');
  const [data, setData] = useState('');
  const [detalhes, setDetalhes] = useState('');
  const [editando, setEditando] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  function limparFormulario() {
    setNome('');
    setData('');
    setDetalhes('');
    setEditando(null);
  }

  // recupera os dados quando a tela recebe foco
  useFocusEffect(
    useCallback(() => {
      let ativo = true;

      async function carregar() {
        if (ativo) setCarregando(true);

        try {
          const id = await obterPetSelecionadoId(db);

          const lista = id
            ? await listarCuidados(db, id, tipo)
            : [];

          if (ativo) {
            setPetId(id);
            setRegistros(lista);
            limparFormulario();
          }
        } catch (erro) {
          console.error('Erro ao carregar cuidados:', erro);

          if (ativo) {
            setPetId(null);
            setRegistros([]);
            Alert.alert('Erro', 'Não foi possível carregar os dados.');
          }
        } finally {
          if (ativo) setCarregando(false);
        }
      }

      carregar();

      return () => {
        ativo = false;
      };
    }, [db, tipo])
  );

  // executa a alteração no banco e atualiza a lista na tela
  async function gravar(lista, acao) {
    if (!petId || salvando) return false;

    setSalvando(true);

    try {
      await acao();

      setRegistros(lista);
      return true;
    } catch (erro) {
      console.error('Erro ao salvar cuidados:', erro);
      Alert.alert('Erro', 'Não foi possível salvar.');
      return false;
    } finally {
      setSalvando(false);
    }
  }

  // cadastra ou edita um registro
  async function salvar() {
    if (!nome.trim()) {
      Alert.alert('Atenção', 'Preencha o nome.');
      return;
    }

    if (!dataValida(data.trim())) {
      Alert.alert(
        'Data inválida',
        'Informe uma data válida no formato DD/MM/AAAA.'
      );
      return;
    }

    const anterior = registros.find(
      item => item.id === editando
    );

    const registro = {
      id: editando ||
        `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      nome: nome.trim(),
      data: data.trim(),
      detalhes: detalhes.trim(),
      concluido: anterior?.concluido || false
    };

    const lista = editando
      ? registros.map(item =>
          item.id === editando ? registro : item
        )
      : [registro, ...registros];

    const sucesso = await gravar(
      lista,
      () => editando
        ? atualizarCuidado(db, registro)
        : inserirCuidado(db, petId, tipo, registro)
    );

    if (sucesso) {
      limparFormulario();
      Alert.alert('Sucesso', 'Registro salvo!');
    }
  }

  // preenche o formulário para editar
  function editar(item) {
    setEditando(item.id);
    setNome(item.nome);
    setData(item.data);
    setDetalhes(item.detalhes || '');
  }

  // marca o cuidado como concluído ou pendente
  async function alterarStatus(id) {
    const atual = registros.find(item => item.id === id);

    if (!atual) return;

    const lista = registros.map(item =>
      item.id === id
        ? { ...item, concluido: !item.concluido }
        : item
    );

    await gravar(
      lista,
      () => alterarStatusCuidado(db, id, !atual.concluido)
    );
  }

  // exclui um cuidado após confirmação
  function excluir(id) {
    Alert.alert(
      'Excluir registro?',
      'Deseja excluir este registro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            const lista = registros.filter(
              item => item.id !== id
            );

            const sucesso = await gravar(
              lista,
              () => removerCuidado(db, id)
            );

            if (sucesso && editando === id) {
              limparFormulario();
            }
          }
        }
      ]
    );
  }

  if (carregando) {
    return <Text>Carregando cuidados...</Text>;
  }

  if (!petId) {
    return (
      <Text style={styles.aviso}>
        Selecione um pet para registrar seus cuidados.
      </Text>
    );
  }

  // consulta = marrom; medicamento = laranja
  const icone = consulta ? 'calendar-outline' : 'medical-outline';

  return (
    <>
      <Text style={styles.tituloSecao}>
        {consulta ? 'Consultas' : 'Medicamentos'}
      </Text>

      {/* formulário */}
      <View style={styles.card}>

        <TextInput
          style={styles.campo}
          placeholder={consulta
            ? 'Nome da consulta (ex.: rotina, dentista)'
            : 'Nome do medicamento'}
          placeholderTextColor="#A89A82"
          value={nome}
          onChangeText={setNome}
        />

        <TextInput
          style={styles.campo}
          placeholder={consulta
            ? 'Data da consulta: DD/MM/AAAA'
            : 'Data de início: DD/MM/AAAA'}
          placeholderTextColor="#A89A82"
          value={data}
          onChangeText={texto => setData(formatarData(texto))}
          keyboardType="numeric"
          maxLength={10}
        />

        <TextInput
          style={[styles.campo, styles.campoGrande]}
          placeholder={consulta
            ? 'Local ou observações (opcional)'
            : 'Dosagem e frequência (ex.: 1 comprimido a cada 12h)'}
          placeholderTextColor="#A89A82"
          value={detalhes}
          onChangeText={setDetalhes}
          multiline
        />

        <Pressable
          onPress={salvar}
          disabled={salvando}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.botao,
            consulta && styles.bolaEscura,
            (pressed || salvando) && styles.pressionado
          ]}
        >
          <Ionicons
            name={editando ? 'checkmark' : 'add'}
            size={20}
            color={consulta ? cores.laranjaClaro : cores.marrom}
          />
          <Text style={[styles.botaoTexto, consulta && { color: cores.laranjaClaro }]}>
            {editando ? 'Salvar alterações' : 'Adicionar'}
          </Text>
        </Pressable>

        {editando && (
          <Pressable onPress={limparFormulario} hitSlop={8}>
            <Text style={styles.link}>Cancelar edição</Text>
          </Pressable>
        )}

      </View>

      {/* lista */}
      {registros.length === 0 && (
        <Text style={styles.vazio}>
          {consulta
            ? 'Sem consultas registradas no momento'
            : 'Sem medicamentos registrados no momento'}
        </Text>
      )}

      {registros.map(item => {

        const feito = item.concluido;

        return (
          <View key={item.id} style={styles.item}>

            {/* tocar na bolinha muda o status */}
            <Pressable
              onPress={() => alterarStatus(item.id)}
              disabled={salvando}
              accessibilityRole="button"
              accessibilityLabel="Alterar status"
              style={({ pressed }) => [
                styles.bola,
                consulta && styles.bolaEscura,
                feito && styles.bolaFeita,
                pressed && styles.pressionado
              ]}
            >
              <Ionicons
                name={feito ? 'checkmark' : icone}
                size={20}
                color={feito || !consulta ? cores.marrom : cores.laranjaClaro}
              />
            </Pressable>

            <View style={styles.textos}>
              <Text
                style={[styles.nome, feito && styles.nomeFeito]}
                numberOfLines={1}
              >
                {item.nome}
              </Text>

              <Text style={styles.informacao} numberOfLines={2}>
                {item.data}{item.detalhes ? ` • ${item.detalhes}` : ''}
              </Text>

              <Text style={[styles.status, !feito && styles.statusAtivo]}>
                {feito
                  ? (consulta ? 'Realizada' : 'Finalizado')
                  : (consulta ? 'Agendada' : 'Em uso')}
              </Text>
            </View>

            <Pressable
              onPress={() => editar(item)}
              disabled={salvando}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Editar"
              style={({ pressed }) => [styles.iconeAcao, pressed && styles.pressionado]}
            >
              <Ionicons name="pencil" size={18} color={cores.marromClaro} />
            </Pressable>

            <Pressable
              onPress={() => excluir(item.id)}
              disabled={salvando}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Excluir"
              style={({ pressed }) => [styles.iconeAcao, pressed && styles.pressionado]}
            >
              <Ionicons name="trash-outline" size={19} color={cores.erro} />
            </Pressable>

          </View>
        );
      })}
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

  
  status: {
    fontFamily: fontes.negrito,
    fontSize: 12,
    lineHeight: 18,
    color: cores.marromClaro,
  },

  statusAtivo: {
    color: cores.laranja,
  },
});