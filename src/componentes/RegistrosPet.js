
import React, { useCallback, useState } from 'react';

import { View, Text, TextInput, TouchableOpacity, Pressable, StyleSheet, Alert, } from 'react-native';

import { useSQLiteContext } from 'expo-sqlite';
import {
  obterPetSelecionadoId,
  listarRegistros,
  inserirRegistro,
  removerRegistro,
} from '../database/Database';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { cores, fontes, sombra } from '../styles/tema';

// est inicial dos registros do pet
const REGISTROS_VAZIOS = {
  alimentacao: [],
  peso: [],
};

// Ex.: "12/11 • 14:10"
function quandoRegistro(texto) {
  const d = new Date(texto);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const hora = String(d.getHours()).padStart(2, '0');
  const minuto = String(d.getMinutes()).padStart(2, '0');

  return `${dia}/${mes} • ${hora}:${minuto}`;
}

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

  const ehAlimentacao = unidade === 'g';

  const atalhos = ehAlimentacao ? ['50', '100', '150', '200'] : [];

  const ultimos = registros.slice(0, 5);
  const restantes = registros.length - ultimos.length;

  return (
    <>
      <Text style={styles.tituloSecao}>{titulo}</Text>

      {/* formulário */}
      <View style={styles.card}>

        <View style={styles.linhaFormulario}>

          <View style={[styles.bola, !ehAlimentacao && styles.bolaEscura]}>
            <Ionicons
              name={ehAlimentacao ? 'restaurant-outline' : 'scale-outline'}
              size={20}
              color={ehAlimentacao ? cores.marrom : cores.laranjaClaro}
            />
          </View>

          <View style={styles.campoCaixa}>
            <TextInput
              style={styles.campoNumero}
              value={valor}
              onChangeText={aoDigitar}
              placeholder={ehAlimentacao ? 'Quanto comeu?' : 'Peso de hoje'}
              placeholderTextColor="#A89A82"
              keyboardType="decimal-pad"
              accessibilityLabel={`${titulo} em ${ehAlimentacao ? 'gramas' : 'quilogramas'}`}
            />
            <Text style={styles.unidade}>{unidade}</Text>
          </View>

          <Pressable
            onPress={aoSalvar}
            disabled={desabilitado}
            accessibilityRole="button"
            accessibilityLabel={`Salvar ${titulo.toLowerCase()}`}
            style={({ pressed }) => [
              styles.botaoRedondo,
              !ehAlimentacao && styles.bolaEscura,
              (pressed || desabilitado) && styles.pressionado,
            ]}
          >
            <Ionicons
              name="checkmark"
              size={24}
              color={ehAlimentacao ? cores.marrom : cores.laranjaClaro}
            />
          </Pressable>

        </View>

        {atalhos.length > 0 ? (
          <View style={styles.atalhos}>
            {atalhos.map(quantidade => (
              <Pressable
                key={quantidade}
                onPress={() => aoDigitar(quantidade)}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.atalho,
                  valor === quantidade && styles.atalhoAtivo,
                  pressed && styles.pressionado,
                ]}
              >
                <Text
                  style={[
                    styles.atalhoTexto,
                    valor === quantidade && styles.atalhoTextoAtivo,
                  ]}
                >
                  {quantidade} g
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

      </View>

      {/* histórico */}
      {registros.length === 0 ? (

        <Text style={styles.vazio}>
          {ehAlimentacao
            ? 'Sem refeições registradas no momento'
            : 'Sem pesagens registradas no momento'}
        </Text>

      ) : (

        ultimos.map((registro) => (

          <View key={registro.id} style={styles.item}>

            <View style={styles.textos}>
              <Text style={styles.nome}>
                {String(registro.valor).replace('.', ',')} {unidade}
              </Text>
              <Text style={styles.informacao}>
                {quandoRegistro(registro.data)}
              </Text>
            </View>

            <Pressable
              onPress={() => aoExcluir(registro.id)}
              disabled={desabilitado}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Excluir registro de ${titulo.toLowerCase()}`}
              style={({ pressed }) => [styles.iconeAcao, pressed && styles.pressionado]}
            >
              <Ionicons name="trash-outline" size={19} color={cores.erro} />
            </Pressable>

          </View>

        ))

      )}

      {restantes > 0 ? (
        <Text style={styles.informacaoCentro}>
          + {restantes} {restantes === 1 ? 'registro anterior' : 'registros anteriores'}
        </Text>
      ) : null}
    </>
  );
}

// componente principal
export default function RegistrosPet() {
  const db = useSQLiteContext();

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

          const id = await obterPetSelecionadoId(db);

          const dados = id
            ? await listarRegistros(db, id)
            : REGISTROS_VAZIOS;

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

    }, [db])
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

      await inserirRegistro(db, petId, tipo, novo);

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

              await removerRegistro(db, idRegistro);

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

  
  linhaFormulario: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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

  informacaoCentro: {
    fontFamily: fontes.regular,
    fontSize: 13,
    color: cores.marromClaro,
    textAlign: 'center',
    marginBottom: 6,
  },

  mensagem: {
    fontFamily: fontes.regular,
    color: cores.marromClaro,
    fontSize: 15,
    marginVertical: 15,
  },

});