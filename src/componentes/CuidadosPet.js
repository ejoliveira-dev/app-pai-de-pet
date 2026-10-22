
import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

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
  const consulta = tipo === 'consulta';

  const [petId, setPetId] = useState(null);
  const [registros, setRegistros] = useState([]);
  const [nome, setNome] = useState('');
  const [data, setData] = useState('');
  const [detalhes, setDetalhes] = useState('');
  const [editando, setEditando] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const chave = (id) => `@tutus:cuidados:${tipo}:${id}`;

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
          const id = await AsyncStorage.getItem(
            '@tutus:petSelecionadoId'
          );

          const texto = id
            ? await AsyncStorage.getItem(chave(id))
            : null;

          const lista = texto ? JSON.parse(texto) : [];

          if (!Array.isArray(lista)) {
            throw new Error('Dados inválidos');
          }

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
    }, [tipo])
  );

  // salva alterações no AsyncStorage
  async function gravar(lista) {
    if (!petId || salvando) return false;

    setSalvando(true);

    try {
      await AsyncStorage.setItem(
        chave(petId),
        JSON.stringify(lista)
      );

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

    const sucesso = await gravar(lista);

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
    const lista = registros.map(item =>
      item.id === id
        ? { ...item, concluido: !item.concluido }
        : item
    );

    await gravar(lista);
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

            const sucesso = await gravar(lista);

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

  return (
    <View style={styles.container}>

      <Text style={styles.titulo}>
        {consulta ? 'Consultas' : 'Medicamentos'}
      </Text>

      <TextInput
        style={styles.campo}
        placeholder={consulta
          ? 'Nome da consulta'
          : 'Nome do medicamento'}
        placeholderTextColor="#8C8177"
        value={nome}
        onChangeText={setNome}
      />

      <TextInput
        style={styles.campo}
        placeholder={consulta
          ? 'Data da consulta: DD/MM/AAAA'
          : 'Data de início: DD/MM/AAAA'}
        placeholderTextColor="#8C8177"
        value={data}
        onChangeText={texto => setData(formatarData(texto))}
        keyboardType="numeric"
        maxLength={10}
      />

      <TextInput
        style={styles.campo}
        placeholder={consulta
          ? 'Local ou observações'
          : 'Dosagem e frequência'}
        placeholderTextColor="#8C8177"
        value={detalhes}
        onChangeText={setDetalhes}
        multiline
      />

      <TouchableOpacity
        style={styles.botao}
        onPress={salvar}
        disabled={salvando}
      >
        <Text style={styles.botaoTexto}>
          {editando ? 'Salvar alterações' : '+ Adicionar'}
        </Text>
      </TouchableOpacity>

      {editando && (
        <TouchableOpacity onPress={limparFormulario}>
          <Text style={styles.acao}>Cancelar edição</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.subtitulo}>Registros</Text>

      {registros.length === 0 && (
        <Text style={styles.aviso}>
          Nenhum registro cadastrado.
        </Text>
      )}

      {registros.map(item => (
        <View key={item.id} style={styles.registro}>

          <Text style={styles.nome}>{item.nome}</Text>
          <Text style={styles.informacao}>
            Data: {item.data}
          </Text>

          {!!item.detalhes && (
            <Text style={styles.informacao}>
              {item.detalhes}
            </Text>
          )}

          <Text style={styles.informacao}>
            Status: {item.concluido
              ? (consulta ? 'Realizada' : 'Finalizado')
              : (consulta ? 'Agendada' : 'Em uso')}
          </Text>

          <TouchableOpacity
            onPress={() => alterarStatus(item.id)}
            disabled={salvando}
          >
            <Text style={styles.acao}>
              Alterar status
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => editar(item)}
            disabled={salvando}
          >
            <Text style={styles.acao}>Editar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => excluir(item.id)}
            disabled={salvando}
          >
            <Text style={styles.excluir}>Excluir</Text>
          </TouchableOpacity>

        </View>
      ))}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FA9F2A',
    borderRadius: 20,
    padding: 18,
    marginBottom: 15
  },
  titulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#332716',
    marginBottom: 12
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
  botaoTexto: {
    color: '#FFFFFF',
    fontWeight: 'bold'
  },
  subtitulo: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#332716',
    marginTop: 20,
    marginBottom: 10
  },
  registro: {
    borderTopWidth: 1,
    borderTopColor: '#EFE6DD',
    paddingVertical: 12
  },
  nome: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#332716'
  },
  informacao: {
    color: '#75571F',
    marginTop: 5
  },
  acao: {
    color: '#80502D',
    fontWeight: 'bold',
    marginTop: 10
  },
  excluir: {
    color: '#A52C2C',
    marginTop: 10
  },
  aviso: {
    color: '#75571F',
    marginVertical: 10
  }
});
