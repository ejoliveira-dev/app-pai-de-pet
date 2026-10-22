
import React, { useCallback, useState } from 'react';

import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

// est inicial dos registros do pet
const REGISTROS_VAZIOS = {
  alimentacao: [],
  peso: [],
};

// componente reutilizável para alimentação e peso
function SecaoRegistro({
  titulo,
  unidade,
  valor,
  aoDigitar,
  aoSalvar,
  registros,
  aoExcluir,
  desabilitado,
}) {
  return (
    <View style={styles.card}>

      <Text style={styles.titulo}>{titulo}</Text>

      <Text style={styles.legenda}>
        Informe {titulo === 'Alimentação'
          ? 'a quantidade de alimento em gramas'
          : 'o peso atual em quilogramas'}.
      </Text>

      {/* campo e botão de salvar */}
      <View style={styles.linhaFormulario}>

        <TextInput
          style={styles.campo}
          value={valor}
          onChangeText={aoDigitar}
          placeholder={unidade === 'g' ? 'Ex.: 150' : 'Ex.: 4,5'}
          placeholderTextColor="#8C8177"
          keyboardType="decimal-pad"
          accessibilityLabel={`${titulo} em ${
            unidade === 'g' ? 'gramas' : 'quilogramas'
          }`}
        />

        <TouchableOpacity
          style={[
            styles.botao,
            desabilitado && styles.botaoDesabilitado,
          ]}
          onPress={aoSalvar}
          disabled={desabilitado}
          accessibilityRole="button"
        >
          <Text style={styles.botaoTexto}>Salvar</Text>
        </TouchableOpacity>

      </View>

      {/* histórico de registros */}
      <Text style={styles.subtitulo}>
        Últimos registros
      </Text>

      {registros.length === 0 ? (

        <Text style={styles.vazio}>
          Nenhum registro ainda.
        </Text>

      ) : (

        registros.slice(0, 5).map((registro) => (

          <View key={registro.id} style={styles.registro}>

            <View style={styles.detalhes}>

              <Text style={styles.valor}>
                {String(registro.valor).replace('.', ',')} {unidade}
              </Text>

              <Text style={styles.data}>
                {new Date(registro.data).toLocaleDateString('pt-BR')}
              </Text>

            </View>

            <TouchableOpacity
              onPress={() => aoExcluir(registro.id)}
              disabled={desabilitado}
              accessibilityRole="button"
              accessibilityLabel={`Excluir registro de ${titulo.toLowerCase()}`}
            >
              <Text style={styles.excluir}>
                Excluir
              </Text>
            </TouchableOpacity>

          </View>

        ))

      )}

    </View>
  );
}

// componente principal
export default function RegistrosPet() {

  const [petId, setPetId] = useState(null);

  const [registros, setRegistros] = useState(REGISTROS_VAZIOS);

  const [alimentacao, setAlimentacao] = useState('');
  const [peso, setPeso] = useState('');

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // recupera os registros quando a tela recebe foco
  useFocusEffect(
    useCallback(() => {

      let ativo = true;

      async function carregarRegistros() {

        if (ativo) setCarregando(true);

        try {

          const id = await AsyncStorage.getItem(
            '@tutus:petSelecionadoId'
          );

          const texto = id
            ? await AsyncStorage.getItem(`@tutus:registros:${id}`)
            : null;

          const dados = texto ? JSON.parse(texto) : {};

          if (
            !dados ||
            typeof dados !== 'object' ||
            Array.isArray(dados)
          ) {
            throw new Error('Registros salvos inválidos');
          }

          if (ativo) {

            setPetId(id);

            setRegistros({
              alimentacao: Array.isArray(dados.alimentacao)
                ? dados.alimentacao
                : [],

              peso: Array.isArray(dados.peso)
                ? dados.peso
                : [],
            });

            setAlimentacao('');
            setPeso('');
          }

        } catch (erro) {

          console.error('Erro ao carregar registros do pet:', erro);

          if (ativo) {
            setPetId(null);
            setRegistros(REGISTROS_VAZIOS);

            Alert.alert(
              'Erro',
              'Não foi possível carregar os registros.'
            );
          }

        } finally {

          if (ativo) setCarregando(false);

        }
      }

      carregarRegistros();

      return () => {
        ativo = false;
      };

    }, [])
  );

  // salva um novo registro no AsyncStorage
  async function salvarRegistro(tipo, texto) {

    if (!petId || salvando) return;

    const entrada = texto.trim().replace(',', '.');
    const numero = Number(entrada);

    if (
      !/^\d+(\.\d{1,2})?$/.test(entrada) ||
      !Number.isFinite(numero) ||
      numero <= 0
    ) {

      Alert.alert(
        'Valor inválido',
        'Digite um número maior que zero. Ex.: 150 ou 4,5.'
      );

      return;
    }

    const novo = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      valor: numero,
      data: new Date().toISOString(),
    };

    const atualizados = {
      ...registros,
      [tipo]: [novo, ...registros[tipo]],
    };

    setSalvando(true);

    try {

      await AsyncStorage.setItem(
        `@tutus:registros:${petId}`,
        JSON.stringify(atualizados)
      );

      setRegistros(atualizados);

      if (tipo === 'alimentacao') {
        setAlimentacao('');
      }

      if (tipo === 'peso') {
        setPeso('');
      }

    } catch (erro) {

      console.error('Erro ao salvar registro:', erro);

      Alert.alert(
        'Erro',
        'O registro não pôde ser salvo. Tente novamente.'
      );

    } finally {

      setSalvando(false);

    }
  }

  // exclui um registro após confirmação
  function confirmarExclusao(tipo, idRegistro) {

    Alert.alert(
      'Excluir registro?',
      'Essa ação não pode ser desfeita.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',

          onPress: async () => {

            if (!petId || salvando) return;

            const atualizados = {
              ...registros,

              [tipo]: registros[tipo].filter(
                (item) => item.id !== idRegistro
              ),
            };

            setSalvando(true);

            try {

              await AsyncStorage.setItem(
                `@tutus:registros:${petId}`,
                JSON.stringify(atualizados)
              );

              setRegistros(atualizados);

            } catch (erro) {

              console.error('Erro ao excluir registro:', erro);

              Alert.alert(
                'Erro',
                'Não foi possível excluir o registro.'
              );

            } finally {

              setSalvando(false);

            }
          },
        },
      ]
    );
  }

  if (carregando) {
    return (
      <Text style={styles.mensagem}>
        Carregando registros...
      </Text>
    );
  }

  if (!petId) {
    return (
      <Text style={styles.mensagem}>
        Selecione um pet na Lista de Pets para registrar
        sua alimentação e seu peso.
      </Text>
    );
  }

  return (
    <View>

      {/* registros de alimentação */}
      <SecaoRegistro
        titulo="Alimentação"
        unidade="g"
        valor={alimentacao}
        aoDigitar={setAlimentacao}
        aoSalvar={() => salvarRegistro('alimentacao', alimentacao)}
        registros={registros.alimentacao}
        aoExcluir={(id) => confirmarExclusao('alimentacao', id)}
        desabilitado={salvando}
      />

      {/* registros de peso */}
      <SecaoRegistro
        titulo="Peso"
        unidade="kg"
        valor={peso}
        aoDigitar={setPeso}
        aoSalvar={() => salvarRegistro('peso', peso)}
        registros={registros.peso}
        aoExcluir={(id) => confirmarExclusao('peso', id)}
        desabilitado={salvando}
      />

    </View>
  );
}

// estilos
const styles = StyleSheet.create({

  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FA9F2A',
    borderRadius: 20,
    padding: 18,
    marginBottom: 15,
  },

  titulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#332716',
  },

  legenda: {
    fontSize: 14,
    color: '#75571F',
    marginTop: 6,
    marginBottom: 12,
  },

  linhaFormulario: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },

  campo: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CDBDA9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#332716',
  },

  botao: {
    backgroundColor: '#80502D',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
  },

  botaoDesabilitado: {
    opacity: 0.5,
  },

  botaoTexto: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  subtitulo: {
    color: '#332716',
    fontWeight: 'bold',
    marginTop: 18,
    marginBottom: 7,
  },

  vazio: {
    color: '#75571F',
  },

  registro: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: '#EFE6DD',
  },

  detalhes: {
    flex: 1,
  },

  valor: {
    fontSize: 16,
    color: '#332716',
  },

  data: {
    fontSize: 12,
    color: '#75571F',
  },

  excluir: {
    color: '#A52C2C',
    padding: 10,
  },

  mensagem: {
    color: '#75571F',
    fontSize: 15,
    marginBottom: 15,
  },

});
