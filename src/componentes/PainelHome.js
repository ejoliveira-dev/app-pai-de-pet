import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Animated, Easing, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Alert } from "../componentes/AlertaTutus";

import { useSQLiteContext } from 'expo-sqlite';

import { carregarResumoPet, salvarIntervaloAlimentacao } from '../database/Database';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import Cartao from './Cartao';
import Botao from './Botao';
import { cores, fontes, raio, sombra, textos } from '../styles/tema';

// Estrutura inicial do painel.
const VAZIO = {
  alimentacao: [],
  peso: [],
  vacinas: [],
  consultas: [],
  medicamentos: []
};

// Converte datas DD/MM/AAAA.
function dataBR(texto) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto || '');

  if (!match) return null;

  const [, dd, mm, aaaa] = match;

  const data = new Date(
    Number(aaaa),
    Number(mm) - 1,
    Number(dd)
  );

  return data.getDate() === Number(dd) &&
    data.getMonth() === Number(mm) - 1 &&
    data.getFullYear() === Number(aaaa)
    ? data
    : null;
}

function dataRegistro(texto) {
  const data = new Date(texto);

  return Number.isNaN(data.getTime()) ? null : data;
}

function chaveDia(data) {
  return `${data.getFullYear()}-${data.getMonth()}-${data.getDate()}`;
}

function numeroBR(valor) {
  return Number(valor).toLocaleString('pt-BR', {
    maximumFractionDigits: 2
  });
}

// Nomes para escrever a data por extenso
const DIAS_SEMANA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

// Opções de intervalo entre refeições, em horas
const OPCOES_INTERVALO = [4, 6, 8, 12, 24];

// Ex.: "terça, 10 de novembro"
function dataPorExtenso(data) {
  return `${DIAS_SEMANA[data.getDay()]}, ${data.getDate()} de ${MESES[data.getMonth()]}`;
}

// Ex.: "14:10"
function horaCurta(data) {
  const horas = String(data.getHours()).padStart(2, '0');
  const minutos = String(data.getMinutes()).padStart(2, '0');

  return `${horas}:${minutos}`;
}

// Ex.: "às 14:10", "ontem às 20:00", "amanhã às 06:00" ou "em 08/11"
function quando(data, agora) {
  const hoje = new Date(agora);
  hoje.setHours(0, 0, 0, 0);

  const dia = new Date(data);
  dia.setHours(0, 0, 0, 0);

  const diferenca = Math.round((dia - hoje) / 86400000);

  if (diferenca === 0) return `às ${horaCurta(data)}`;
  if (diferenca === -1) return `ontem às ${horaCurta(data)}`;
  if (diferenca === 1) return `amanhã às ${horaCurta(data)}`;

  const dd = String(data.getDate()).padStart(2, '0');
  const mm = String(data.getMonth() + 1).padStart(2, '0');

  return `em ${dd}/${mm}`;
}

function TituloSecao({ children, style }) {
  return <Text style={[styles.tituloSecao, style]}>{children}</Text>;
}

function Bolinha({ nome, tamanho = 40 }) {
  return (
    <View
      style={[
        styles.bolinha,
        { width: tamanho, height: tamanho, borderRadius: tamanho / 2 }
      ]}
    >
      <Ionicons name={nome} size={tamanho * 0.5} color={cores.marrom} />
    </View>
  );
}

function Vazio({ icone, texto, acao, onAcao }) {
  return (
    <View style={styles.vazio}>
      <Bolinha nome={icone} tamanho={48} />
      <Text style={styles.textoVazio}>{texto}</Text>
      {acao && onAcao ? (
        <Botao
          titulo={acao}
          onPress={onAcao}
          variante="contorno"
          style={styles.botaoPequeno}
        />
      ) : null}
    </View>
  );
}

function ItemLista({ icone, titulo, detalhe, atrasado, ultimo }) {
  return (
    <View style={[styles.itemLista, !ultimo && styles.itemDivisor]}>
      <Bolinha nome={icone} />
      <View style={styles.textoItem}>
        <Text style={styles.itemTitulo} numberOfLines={1}>
          {titulo}
        </Text>
        <Text style={styles.textoSecundario}>{detalhe}</Text>
      </View>
      {atrasado ? (
        <View style={styles.selo}>
          <Text style={styles.textoSelo}>Atrasado</Text>
        </View>
      ) : null}
    </View>
  );
}

// Altura da cápsula do gráfico e a menor barra em que ainda cabe o número
const ALTURA_CAPSULA = 132;
const BARRA_MINIMA = 36;


const CORES_BARRAS = [
  { fundo: cores.marrom, texto: cores.laranjaClaro },
  { fundo: cores.terracota || '#D18B5F', texto: cores.marrom },
  { fundo: cores.marromClaro, texto: cores.fundo }
];

function Grafico({ alimentacao, peso }) {

  const [modo, setModo] = useState('alimentacao');

  const escuro = modo === 'peso';

  // vai de 0 (barras vazias) a 1 (barras na altura final)
  const crescimento = useRef(new Animated.Value(0)).current;

  // colunas do modo escolhido
  let colunas;

  if (modo === 'alimentacao') {

    const maximo = Math.max(
      1,
      ...alimentacao.map(item => item.valor)
    );

    colunas = alimentacao.map((item, indice) => {

      const hoje = indice === alimentacao.length - 1;

      const cor = hoje
        ? { fundo: cores.laranja, texto: cores.marrom }
        : CORES_BARRAS[indice % CORES_BARRAS.length];

      return {
        chave: `alimentacao-${indice}`,
        rotulo: hoje ? 'hoje' : item.label,
        texto: `${numeroBR(item.valor)}g`,
        altura: item.valor > 0
          ? BARRA_MINIMA + (item.valor / maximo) * (ALTURA_CAPSULA - BARRA_MINIMA)
          : 0,
        destaque: hoje,
        fundo: cor.fundo,
        corTexto: cor.texto
      };
    });

  } else {

    // no peso, a escala vai do menor ao maior valor, para a variação aparecer
    const valores = peso.map(item => item.valor);
    const menor = Math.min(...valores);
    const maior = Math.max(...valores);

    colunas = peso.map((item, indice) => {

      const ultimo = indice === peso.length - 1;

      return {
        chave: `peso-${indice}`,
        rotulo: item.label,
        texto: `${numeroBR(item.valor)}kg`,
        altura: maior === menor
          ? ALTURA_CAPSULA * 0.7
          : ALTURA_CAPSULA * 0.45 +
            ((item.valor - menor) / (maior - menor)) * ALTURA_CAPSULA * 0.55,
        destaque: ultimo,
        fundo: ultimo ? cores.laranja : cores.laranjaClaro,
        corTexto: cores.marrom
      };
    });

    // completa com cápsulas vazias até ter 5
    while (colunas.length < 5) {
      colunas.unshift({
        chave: `vazia-${colunas.length}`,
        rotulo: '',
        texto: '',
        altura: 0,
        destaque: false,
        fundo: 'transparent',
        corTexto: cores.marrom
      });
    }
  }

  const temDados = colunas.some(coluna => coluna.altura > 0);

  // muda só quando o desenho das barras muda (não a cada minuto)
  const assinatura = `${modo}:${colunas.map(coluna => Math.round(coluna.altura)).join(',')}`;

  // as barras crescem ao abrir a tela, ao trocar o seletor e quando os dados mudam
  useFocusEffect(
    useCallback(() => {

      crescimento.setValue(0);

      const animacao = Animated.timing(crescimento, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false
      });

      animacao.start();

      return () => animacao.stop();

    }, [assinatura, crescimento])
  );

  return (
    <>
      <View style={styles.linhaTitulo}>

        <TituloSecao>Acompanhamento</TituloSecao>

        <View style={styles.seletor}>
          {[
            { id: 'alimentacao', nome: 'Alimentação' },
            { id: 'peso', nome: 'Peso' }
          ].map(opcao => {

            const ativa = modo === opcao.id;
            const dePeso = opcao.id === 'peso';

            return (
              <Pressable
                key={opcao.id}
                onPress={() => setModo(opcao.id)}
                accessibilityRole="button"
                style={[
                  styles.seletorOpcao,
                  ativa && (dePeso ? styles.seletorOpcaoPeso : styles.seletorOpcaoAlimentacao)
                ]}
              >
                <Text
                  style={[
                    styles.seletorTexto,
                    ativa && (dePeso ? styles.seletorTextoPeso : styles.seletorTextoAlimentacao)
                  ]}
                >
                  {opcao.nome}
                </Text>
              </Pressable>
            );
          })}
        </View>

      </View>

      <View style={[styles.capsulas, escuro && styles.capsulasEscuro]}>

        {temDados ? (
        <View style={styles.capsulasLinha}>

          {colunas.map(coluna => (

            <View
              key={coluna.chave}
              style={styles.capsulaColuna}
            >

              <View style={[styles.capsulaTrilho, escuro && styles.capsulaTrilhoEscuro]}>

                {coluna.altura > 0 ? (
                  <Animated.View
                    style={[
                      styles.capsulaBarra,
                      {
                        backgroundColor: coluna.fundo,
                        height: crescimento.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, coluna.altura]
                        })
                      }
                    ]}
                  >
                    <Text
                      style={[styles.capsulaNumero, { color: coluna.corTexto }]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    >
                      {coluna.texto}
                    </Text>
                  </Animated.View>
                ) : null}

              </View>

              <Text
                style={[
                  styles.capsulaRotulo,
                  escuro && styles.capsulaRotuloEscuro,
                  coluna.destaque && styles.capsulaRotuloHoje,
                  coluna.destaque && escuro && styles.capsulaRotuloHojeEscuro
                ]}
                numberOfLines={1}
              >
                {coluna.rotulo}
              </Text>

            </View>

          ))}

        </View>
        ) : (
          <Text style={[styles.capsulasNota, escuro && styles.capsulasNotaEscuro]}>
            {modo === 'alimentacao'
              ? 'Sem refeições registradas no momento'
              : 'Sem pesagens registradas no momento'}
          </Text>
        )}

      </View>
    </>
  );
}

// componente principal da Home.
export default function PainelHome({
  pet,
  onAbrirCuidados
}) {

  const db = useSQLiteContext();

  const id = pet?.id_pet;

  const [dados, setDados] = useState(VAZIO);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const [periodo, setPeriodo] = useState(7);
  const [intervalo, setIntervalo] = useState(null);
  const [horasTexto, setHorasTexto] = useState('');

  const [agora, setAgora] = useState(Date.now());

  // atualiza o relógio a cada minuto.
  useEffect(() => {

    const relogio = setInterval(
      () => setAgora(Date.now()),
      60000
    );

    return () => clearInterval(relogio);

  }, []);

  // recupera os dados do pet selecionado.
  useFocusEffect(
    useCallback(() => {

      let ativo = true;

      setAgora(Date.now());

      if (id == null) {

        setDados(VAZIO);
        setIntervalo(null);
        setHorasTexto('');
        setCarregando(false);

        return () => {
          ativo = false;
        };
      }

      async function carregar() {

        setCarregando(true);
        setErro('');

        try {

          const resumo = await carregarResumoPet(db, id);

          const horas = resumo.intervalo;

          const intervaloSalvo = Number(horas);

          if (ativo) {

            setDados({

              alimentacao: resumo.alimentacao,

              peso: resumo.peso,

              vacinas: resumo.vacinas,

              consultas: resumo.consultas,

              medicamentos: resumo.medicamentos

            });

            const valido =
              horas !== null &&
              Number.isInteger(intervaloSalvo) &&
              intervaloSalvo >= 1 &&
              intervaloSalvo <= 24;

            setIntervalo(
              valido ? intervaloSalvo : null
            );

            setHorasTexto(
              valido ? String(intervaloSalvo) : ''
            );
          }

        } catch (e) {

          console.error(
            'Erro ao carregar resumo da Home:',
            e
          );

          if (ativo) {

            setDados(VAZIO);

            setErro(
              'Não foi possível carregar o resumo. Abra esta aba novamente.'
            );
          }

        } finally {

          if (ativo) {
            setCarregando(false);
          }

        }
      }

      carregar();

      return () => {
        ativo = false;
      };

    }, [db, id])
  );

  // Salva o intervalo entre refeições.
  async function salvarIntervalo() {

    if (id == null) return;

    const entrada = horasTexto.trim();

    if (!/^([1-9]|1\d|2[0-4])$/.test(entrada)) {

      Alert.alert(
        'Intervalo inválido',
        'Informe um número inteiro entre 1 e 24 horas.'
      );

      return;
    }

    try {

      await salvarIntervaloAlimentacao(db, id, entrada);

      setIntervalo(Number(entrada));

      Alert.alert(
        'Salvo',
        'Intervalo definido por você para este pet.'
      );

    } catch (e) {

      Alert.alert(
        'Erro',
        'Não foi possível salvar o intervalo.'
      );

    }
  }

  // Calcula as informações apresentadas na Home.
  const calculos = useMemo(() => {

    const hoje = new Date(agora);
    hoje.setHours(0, 0, 0, 0);

    const chaveHoje = chaveDia(hoje);

    // Alimentação.
    const alimentacoes = dados.alimentacao
      .filter(
        item =>
          dataRegistro(item.data) &&
          Number(item.valor) > 0
      )
      .sort(
        (a, b) =>
          new Date(b.data) - new Date(a.data)
      );

    const hojeRegistros = alimentacoes.filter(
      item =>
        chaveDia(new Date(item.data)) === chaveHoje
    );

    const totalHoje = hojeRegistros.reduce(
      (soma, item) =>
        soma + Number(item.valor),
      0
    );

    const ultimoAlimento = alimentacoes[0] || null;

    // Peso
    const pesos = dados.peso
      .filter(
        item =>
          dataRegistro(item.data) &&
          Number(item.valor) > 0
      )
      .sort(
        (a, b) =>
          new Date(a.data) - new Date(b.data)
      );

    const ultimoPeso = pesos[pesos.length - 1];

    // Gráfico de alimentação dos últimos 7 dias.
    const alimentacaoSemana = Array.from(
      { length: 7 },
      (_, indice) => {

        const dia = new Date(hoje);

        dia.setDate(
          hoje.getDate() - 6 + indice
        );

        const total = alimentacoes
          .filter(
            item =>
              chaveDia(new Date(item.data)) === chaveDia(dia)
          )
          .reduce(
            (soma, item) =>
              soma + Number(item.valor),
            0
          );

        return {
          label: dia
            .toLocaleDateString('pt-BR', {
              weekday: 'short'
            })
            .replace('.', ''),

          valor: total
        };
      }
    );

    // Gráfico dos últimos 5 pesos registrados.
    const pesoHistorico = pesos.slice(-5).map(
      item => ({

        label: new Date(item.data)
          .toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit'
          }),

        valor: Number(item.valor)

      })
    );

    // Consultas e vacinas pendentes.
    const eventos = [

      ...dados.vacinas
        .filter(item => !item.aplicada)
        .map(item => ({
          id: `vacina-${item.id}`,
          tipo: 'Vacina',
          nome: item.nome,
          data: dataBR(item.data)
        })),

      ...dados.consultas
        .filter(item => !item.concluido)
        .map(item => ({
          id: `consulta-${item.id}`,
          tipo: 'Consulta',
          nome: item.nome,
          data: dataBR(item.data)
        }))

    ]
      .filter(item => item.data)
      .sort(
        (a, b) => a.data - b.data
      );

    // Filtro de 7 ou 30 dias.
    const fim = new Date(hoje);

    fim.setDate(
      fim.getDate() + periodo
    );

    const proximos = eventos.filter(
      item =>
        item.data >= hoje &&
        item.data < fim
    );

    const atrasados = eventos.filter(
      item => item.data < hoje
    );

    // Medicamentos em uso.
    const medicamentosAtivos = dados.medicamentos.filter(
      item => !item.concluido
    );

    // Lembretes dos próximos 3 dias.
    const limiteLembrete = new Date(hoje);

    limiteLembrete.setDate(
      limiteLembrete.getDate() + 3
    );

    const lembretes = eventos
      .filter(
        item => item.data < limiteLembrete
      )
      .slice(0, 4);

    // Tempo até a próxima refeição
    let proximaRefeicao =
      'Defina um intervalo para ver a previsão.';

    if (intervalo && !ultimoAlimento) {

      proximaRefeicao =
        'Registre uma refeição para iniciar a previsão.';

    } else if (intervalo && ultimoAlimento) {

      const restante =
        new Date(ultimoAlimento.data).getTime() +
        intervalo * 3600000 -
        agora;

      if (restante <= 0) {

        proximaRefeicao =
          'O horário estimado já passou.';

      } else {

        const minutos = Math.ceil(
          restante / 60000
        );

        const horas = Math.floor(
          minutos / 60
        );

        proximaRefeicao =
          `Faltam ${horas ? `${horas}h ` : ''}${minutos % 60}min`;
      }
    }

    return {

      totalHoje,
      quantidadeHoje: hojeRegistros.length,
      ultimoPeso,
      proximaRefeicao,
      alimentacaoSemana,
      pesoHistorico,
      proximos,
      atrasados,
      medicamentosAtivos,
      lembretes
    };

  }, [dados, agora, periodo, intervalo]);

  //Cartão "Próxima refeição"

  // true enquanto os botões de intervalo (4h, 6h...) estão abertos
  const [escolhendoIntervalo, setEscolhendoIntervalo] = useState(false);

  // Salva o intervalo escolhido nos botões
  async function escolherIntervalo(horas) {

    if (id == null) return;

    try {

      await salvarIntervaloAlimentacao(db, id, String(horas));

      setIntervalo(horas);
      setHorasTexto(String(horas));
      setEscolhendoIntervalo(false);

    } catch (e) {

      Alert.alert(
        'Erro',
        'Não foi possível salvar o intervalo.'
      );

    }
  }

  const refeicao = useMemo(() => {

    if (!intervalo) return { estado: 'semIntervalo' };

    const ultimaRefeicao = dados.alimentacao
      .filter(item => dataRegistro(item.data) && Number(item.valor) > 0)
      .sort((a, b) => new Date(b.data) - new Date(a.data))[0];

    if (!ultimaRefeicao) return { estado: 'semRegistro' };

    const inicio = new Date(ultimaRefeicao.data).getTime();
    const duracao = intervalo * 3600000;
    const falta = inicio + duracao - agora;

    const totalMinutos = Math.max(0, Math.ceil(falta / 60000));
    const h = Math.floor(totalMinutos / 60);
    const m = totalMinutos % 60;

    const tempo = h && m
      ? `${h}h ${m}min`
      : h
        ? `${h}h`
        : `${m}min`;

    const horaPrevista = new Date(inicio + duracao).getHours();

    return {
      estado: falta <= 0 ? 'passou' : 'contando',
      perto: falta <= 3600000,
      tempo,
      fracao: Math.min(1, Math.max(0, (agora - inicio) / duracao)),
      ultima: quando(new Date(inicio), agora),
      prevista: quando(new Date(inicio + duracao), agora),
      deDia: horaPrevista >= 6 && horaPrevista < 18,
    };

  }, [dados, agora, intervalo]);

  const modoRefeicao = !intervalo || escolhendoIntervalo
    ? 'intervalo'
    : refeicao.estado === 'contando' && !refeicao.perto
      ? 'longe'
      : 'acao';

  const paleta = modoRefeicao === 'acao'
    ? {
      fundo: cores.laranja,
      texto: cores.marrom,
      suave: 'rgba(51, 39, 22, 0.78)',
      rotulo: 'rgba(51, 39, 22, 0.72)',
      anel: 'rgba(255, 234, 200, 0.28)',
      bola: cores.laranjaClaro,
      trilho: 'rgba(51, 39, 22, 0.16)',
      barra: cores.marrom,
      chip: 'rgba(255, 253, 248, 0.38)',
      botao: cores.marrom,
      textoBotao: cores.laranjaClaro,
    }
    : {
      fundo: cores.marrom,
      texto: cores.laranjaClaro,
      suave: 'rgba(255, 234, 200, 0.72)',
      rotulo: '#D18B5F',
      anel: 'rgba(250, 159, 42, 0.13)',
      bola: cores.laranja,
      trilho: 'rgba(255, 234, 200, 0.16)',
      barra: cores.laranja,
      chip: 'rgba(255, 234, 200, 0.13)',
      botao: cores.laranja,
      textoBotao: cores.marrom,
    };

  const nomePet = pet?.nome || 'Seu pet';

  const primeiroNomePet = nomePet.trim().split(' ')[0];

  const fraseRefeicao = refeicao.estado === 'semRegistro'
    ? 'Registre a primeira refeição'
    : refeicao.estado === 'passou'
      ? `Hora de comer, ${nomePet}!`
      : `${nomePet} come em ${refeicao.tempo}`;

  const iconeRefeicao = modoRefeicao !== 'longe'
    ? 'restaurant-outline'
    : refeicao.deDia
      ? 'sunny-outline'
      : 'moon-outline';

  const pesagens = calculos.pesoHistorico;

  const diferencaPeso = pesagens.length >= 2
    ? pesagens[pesagens.length - 1].valor - pesagens[pesagens.length - 2].valor
    : null;

  const textoPeso = !calculos.ultimoPeso
    ? ''
    : diferencaPeso === null
      ? 'peso atual'
      : Math.abs(diferencaPeso) < 0.005
        ? 'mesmo peso'
        : `${diferencaPeso > 0 ? 'subiu' : 'desceu'} ${numeroBR(Math.abs(diferencaPeso))} kg`;

  // Mensagem se não houver pet selecionado
  if (!pet) {

    return (
      <Vazio
        icone="paw-outline"
        texto="Selecione um pet para visualizar seu resumo."
      />
    );
  }

  const agenda = [...calculos.atrasados, ...calculos.proximos];

  function seloAgenda(data) {
    const hoje = new Date(agora);
    hoje.setHours(0, 0, 0, 0);

    const dias = Math.round((data - hoje) / 86400000);

    if (dias < 0) return { texto: 'Atrasada', estilo: 'seloAtrasado', estiloTexto: 'textoSeloClaro' };
    if (dias === 0) return { texto: 'Hoje', estilo: 'seloHoje', estiloTexto: 'textoSeloEscuro' };
    if (dias === 1) return { texto: 'Amanhã', estilo: 'seloAmanha', estiloTexto: 'textoSeloClaro' };

    return { texto: `em ${dias} dias`, estilo: 'seloDepois', estiloTexto: 'textoSeloEscuro' };
  }

  const inicioHoje = new Date(agora).setHours(0, 0, 0, 0);

  return (

    <View style={styles.painel}>

      {carregando && (
        <Text style={styles.textoSecundario}>
          Atualizando informações...
        </Text>
      )}

      {!!erro && (
        <View style={styles.faixaErro}>
          <Ionicons name="alert-circle-outline" size={20} color={cores.erro} />
          <Text style={styles.textoErro}>{erro}</Text>
        </View>
      )}

      {/* HOJE */}
      <View style={styles.linhaTitulo}>
        <TituloSecao>Hoje</TituloSecao>

        <Text style={styles.dataHoje}>
          {dataPorExtenso(new Date(agora))}
        </Text>
      </View>

      {/* HOJE: PRÓXIMA REFEIÇÃO */}
      <View style={[styles.refeicao, { backgroundColor: paleta.fundo }]}>

        <View style={[styles.refeicaoAnel, { backgroundColor: paleta.anel }]} />

        <View style={[styles.refeicaoBola, { backgroundColor: paleta.bola }]}>

          <Ionicons name={iconeRefeicao} size={35} color={cores.marrom} />

        </View>

        <View style={styles.refeicaoTextos}>

          <View style={styles.refeicaoRotuloLinha}>
            <Text style={[styles.refeicaoRotulo, { color: paleta.rotulo }]}>
              PRÓXIMA REFEIÇÃO
            </Text>

            <Pressable
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Como a previsão funciona"
              style={{ transform: [{ translateY: -3 }] }}
              onPress={() => Alert.alert(
                'Como funciona',
                'A previsão soma o intervalo que você escolheu ao horário da última refeição registrada. Não é uma recomendação veterinária.'
              )}
            >
              <Ionicons name="information-circle-outline" size={14} color={paleta.rotulo} />
            </Pressable>
          </View>

          {modoRefeicao === 'intervalo' ? (
            <Text style={[styles.refeicaoFrase, { color: paleta.texto }]}>
              De quanto em quanto tempo?
            </Text>
          ) : modoRefeicao === 'longe' ? (
            <Text
              style={[styles.refeicaoTempo, { color: paleta.texto }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              <Text style={[styles.refeicaoEm, { color: paleta.suave }]}>em </Text>
              {refeicao.tempo}
            </Text>
          ) : (
            <Text style={[styles.refeicaoFrase, { color: paleta.texto }]}>
              {fraseRefeicao}
            </Text>
          )}

        </View>

        {modoRefeicao === 'intervalo' ? (

          <View style={styles.opcoesIntervalo}>
            {OPCOES_INTERVALO.map(horas => (
              <Pressable
                key={horas}
                onPress={() => escolherIntervalo(horas)}
                accessibilityRole="button"
                accessibilityLabel={`A cada ${horas} horas`}
                style={({ pressed }) => [
                  styles.opcaoIntervalo,
                  { backgroundColor: intervalo === horas ? cores.laranja : paleta.chip },
                  pressed && styles.pressionado
                ]}
              >
                <Text
                  style={[
                    styles.textoOpcaoIntervalo,
                    { color: intervalo === horas ? cores.marrom : paleta.texto }
                  ]}
                >
                  {horas}h
                </Text>
              </Pressable>
            ))}
          </View>

        ) : (
          <>
            {modoRefeicao === 'longe' ? (
              <>
                <View style={[styles.barraFundo, { backgroundColor: paleta.trilho }]}>
                  <View
                    style={[
                      styles.barraCheia,
                      {
                        backgroundColor: paleta.barra,
                        width: `${Math.round(refeicao.fracao * 100)}%`
                      }
                    ]}
                  />
                </View>

                <View style={styles.barraPontas}>
                  <Text style={[styles.refeicaoLegenda, { color: paleta.suave }]}>
                    comeu {refeicao.ultima}
                  </Text>
                  <Text style={[styles.refeicaoLegenda, { color: paleta.suave }]}>
                    prevista {refeicao.prevista}
                  </Text>
                </View>
              </>
            ) : refeicao.prevista ? (
              <Text style={[styles.refeicaoLegenda, styles.refeicaoLegendaSolta, { color: paleta.suave }]}>
                prevista {refeicao.prevista}
              </Text>
            ) : null}

            <View style={styles.refeicaoAcoes}>

              <Pressable
                onPress={() => setEscolhendoIntervalo(true)}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Mudar o intervalo entre refeições"
                style={({ pressed }) => [
                  styles.refeicaoChip,
                  { backgroundColor: paleta.bola },
                  pressed && styles.pressionado
                ]}
              >
                <Text style={[styles.refeicaoChipTexto, { color: cores.marrom }]}>
                  a cada {intervalo}h
                </Text>
                <Ionicons name="pencil" size={13} color={cores.marrom} />
              </Pressable>

              <Pressable
                onPress={onAbrirCuidados}
                accessibilityRole="button"
                accessibilityLabel="Registrar refeição"
                style={({ pressed }) => [
                  styles.refeicaoBotao,
                  { backgroundColor: paleta.botao },
                  pressed && styles.pressionado
                ]}
              >
                <Ionicons name="add" size={18} color={paleta.textoBotao} />
                <Text style={[styles.refeicaoBotaoTexto, { color: paleta.textoBotao }]}>
                  Refeição
                </Text>
              </Pressable>

            </View>
          </>
        )}

      </View>

      <View style={styles.duasColunas}>

        {/* Alimentação */}
        <Pressable
          onPress={onAbrirCuidados}
          accessibilityRole="button"
          accessibilityLabel="Ver registros de alimentação"
          style={({ pressed }) => [
            styles.resumoBloco,
            pressed && styles.pressionado
          ]}
        >
          <View style={styles.resumoBola}>
            <Ionicons name="restaurant-outline" size={20} color={cores.marrom} />
          </View>

          <View style={styles.resumoTextos}>
            {calculos.totalHoje > 0 ? (
              <Text style={styles.resumoFrase} numberOfLines={3}>
                {primeiroNomePet} comeu{' '}
                <Text style={styles.resumoFraseDestaque}>
                  {numeroBR(calculos.totalHoje)} g
                </Text>
                {' '}hoje!
              </Text>
            ) : (
              <Text style={styles.resumoValor}>—</Text>
            )}
          </View>
        </Pressable>

        {/* Peso */}
        <Pressable
          onPress={onAbrirCuidados}
          accessibilityRole="button"
          accessibilityLabel="Ver registros de peso"
          style={({ pressed }) => [
            styles.resumoBloco,
            pressed && styles.pressionado
          ]}
        >
          <View style={[styles.resumoBola, styles.resumoBolaEscura]}>
            <Ionicons name="scale-outline" size={20} color={cores.laranjaClaro} />
          </View>

          <View style={styles.resumoTextos}>
            <Text style={styles.resumoValor} numberOfLines={1}>
              {calculos.ultimoPeso
                ? `${numeroBR(calculos.ultimoPeso.valor)} kg`
                : '—'}
            </Text>
              {textoPeso ? (
              <Text style={styles.resumoLegenda} numberOfLines={1}>
                {textoPeso}
            </Text>
            ) : null}
          </View>
        </Pressable>

      </View>

      {/* GRÁFICOS */}
      <Grafico
        alimentacao={calculos.alimentacaoSemana}
        peso={calculos.pesoHistorico}
      />

      <View style={styles.linhaTitulo}>

        <TituloSecao>Agenda</TituloSecao>

        <View style={styles.seletor}>
          {[7, 30].map(dias => (
            <Pressable
              key={dias}
              onPress={() => setPeriodo(dias)}
              accessibilityRole="button"
              style={[
                styles.seletorOpcao,
                periodo === dias && styles.seletorOpcaoPeso
              ]}
            >
              <Text
                style={[
                  styles.seletorTexto,
                  periodo === dias && styles.seletorTextoPeso
                ]}
              >
                {dias} dias
              </Text>
            </Pressable>
          ))}
        </View>

      </View>

      {agenda.length === 0 ? (

        <Pressable
          onPress={onAbrirCuidados}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.agendaItem,
            pressed && styles.pressionado
          ]}
        >
          <View style={[styles.agendaBola, styles.agendaBolaOk]}>
            <Ionicons name="checkmark" size={22} color={cores.marrom} />
          </View>

          <View style={styles.agendaTextos}>
            <Text style={styles.agendaTitulo}>Tudo em dia</Text>
            <Text style={styles.agendaDetalhe}>
              Nada pendente nos próximos {periodo} dias
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={18} color={cores.marromClaro} />
        </Pressable>

      ) : (

        agenda.map(item => {

          const selo = seloAgenda(item.data);

          return (
            <Pressable
              key={item.id}
              onPress={onAbrirCuidados}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.agendaItem,
                pressed && styles.pressionado
              ]}
            >
              <View
                style={[
                  styles.agendaBola,
                  item.tipo === 'Vacina' ? styles.agendaBolaVacina : styles.agendaBolaConsulta
                ]}
              >
                <Ionicons
                  name={item.tipo === 'Vacina' ? 'medkit-outline' : 'calendar-outline'}
                  size={20}
                  color={item.tipo === 'Vacina' ? cores.marrom : cores.laranjaClaro}
                />
              </View>

              <View style={styles.agendaTextos}>
                <Text style={styles.agendaTitulo} numberOfLines={1}>
                  {item.nome}
                </Text>
                <Text style={styles.agendaDetalhe}>
                  {item.tipo} • {item.data.toLocaleDateString('pt-BR')}
                </Text>
              </View>

              <View style={[styles.selo, styles[selo.estilo]]}>
                <Text style={[styles.textoSelo, styles[selo.estiloTexto]]}>
                  {selo.texto}
                </Text>
              </View>
            </Pressable>
          );
        })

      )}

      {/* remédios em uso, em pílulas */}
      {calculos.medicamentosAtivos.length > 0 ? (
        <View style={styles.emUso}>

          <Text style={styles.emUsoRotulo}>Em uso</Text>

          {calculos.medicamentosAtivos.map(item => (
            <Pressable
              key={String(item.id)}
              onPress={onAbrirCuidados}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.emUsoPilula,
                pressed && styles.pressionado
              ]}
            >
              <Ionicons name="medical-outline" size={14} color={cores.laranja} />
              <Text style={styles.emUsoTexto} numberOfLines={1}>
                {item.nome}
              </Text>
            </Pressable>
          ))}

        </View>
      ) : null}

    </View>
  );
}

const styles = StyleSheet.create({

  painel: {
    marginTop: 5,
  },

  //"Hoje" =cartão da próxima refeição.
  dataHoje: {
    fontFamily: fontes.regular,
    fontSize: 18,
    lineHeight: 30,
    color: cores.marromClaro,
    marginTop: 12,
  },

  refeicao: {
    borderRadius: 30,
    padding: 18,
    marginBottom: 12,
    overflow: 'hidden',
  },

  refeicaoAnel: {
    position: 'absolute',
    top: -52,
    right: -46,
    width: 190,
    height: 190,
    borderRadius: 95,
  },

  refeicaoBola: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 75,
    height: 75,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
  },

  refeicaoTextos: {
    minHeight: 78,
    paddingRight: 88,
  },

  refeicaoRotuloLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  refeicaoRotulo: {
    fontFamily: fontes.negrito,
    fontSize: 12,
    lineHeight: 22,
    letterSpacing: 1.6,
  },

  refeicaoTempo: {
    fontFamily: fontes.negrito,
    fontSize: 38,
    lineHeight: 48,
    marginTop: 6,
  },

  refeicaoEm: {
    fontFamily: fontes.regular,
    fontSize: 17,
  },

  refeicaoFrase: {
    fontFamily: fontes.negrito,
    fontSize: 24,
    lineHeight: 29,
    marginTop: 5,
  },

  barraFundo: {
    height: 12,
    borderRadius: 6,
    marginTop: 12,
    overflow: 'hidden',
  },

  barraCheia: {
    height: '100%',
    borderRadius: 6,
  },

  barraPontas: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 7,
  },

  refeicaoLegenda: {
    fontFamily: fontes.regular,
    fontSize: 12,
    lineHeight: 18,
  },

  refeicaoLegendaSolta: {
    marginTop: 6,
  },

  refeicaoAcoes: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },

  refeicaoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingHorizontal: 13,
    borderRadius: 17,
  },

  refeicaoChipTexto: {
    fontFamily: fontes.negrito,
    fontSize: 14,
    lineHeight: 44,
  },

  refeicaoBotao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 38,
    paddingLeft: 12,
    paddingRight: 16,
    borderRadius: 19,
  },

  refeicaoBotaoTexto: {
    fontFamily: fontes.negrito,
    fontSize: 18,
    lineHeight: 48,
  },

  opcoesIntervalo: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },

  opcaoIntervalo: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 5,
    borderRadius: 17,
  },

  textoOpcaoIntervalo: {
    fontFamily: fontes.negrito,
    fontSize: 15,
    lineHeight: 25,
    paddingTop: 5,
  },

  pressionado: {
    opacity: 0.6,
    transform: [{ scale: 0.96 }],
  },

  resumoBloco: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: cores.branco,
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 12,
    ...sombra,
  },

  resumoBola: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: cores.laranja,
    alignItems: 'center',
    justifyContent: 'center',
  },

  resumoBolaEscura: {
    backgroundColor: cores.marrom,
  },

  resumoTextos: {
    flex: 1,
    minWidth: 0,
  },

  resumoValor: {
    fontFamily: fontes.negrito,
    fontSize: 20,
    lineHeight: 27,
    color: cores.marrom,
  },

  resumoFrase: {
    fontFamily: fontes.regular,
    fontSize: 15,
    lineHeight: 21,
    color: cores.marromClaro,
  },

  resumoFraseDestaque: {
    fontFamily: fontes.negrito,
    color: cores.marrom,
  },

  resumoLegenda: {
    fontFamily: fontes.regular,
    fontSize: 13,
    lineHeight: 18,
    color: cores.marromClaro,
  },

  // seletor de duas opções (Alimentação | Peso)
  seletor: {
    flexDirection: 'row',
    backgroundColor: cores.branco,
    borderRadius: 17,
    padding: 3,
    marginTop: 12,
    ...sombra,
  },

  seletorOpcao: {
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  seletorOpcaoAlimentacao: {
    backgroundColor: cores.laranja,
  },

  seletorOpcaoPeso: {
    backgroundColor: cores.marrom,
  },

  seletorTexto: {
    fontFamily: fontes.negrito,
    fontSize: 13,
    color: cores.marromClaro,
  },

  seletorTextoAlimentacao: {
    color: cores.marrom,
  },

  seletorTextoPeso: {
    color: cores.fundo,
  },

  capsulas: {
    backgroundColor: cores.branco,
    borderRadius: 28,
    paddingTop: 16,
    paddingHorizontal: 14,
    paddingBottom: 10,
    marginBottom: 12,
    ...sombra,
  },

  capsulasEscuro: {
    backgroundColor: cores.marrom,
  },

  capsulasLinha: {
    flexDirection: 'row',
    gap: 8,
  },

  capsulaColuna: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
  },

  capsulaTrilho: {
    width: '100%',
    height: ALTURA_CAPSULA,
    borderRadius: 19,
    backgroundColor: 'rgba(51, 39, 22, 0.06)',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },

  capsulaTrilhoEscuro: {
    backgroundColor: 'rgba(255, 234, 200, 0.12)',
  },

  capsulaBarra: {
    width: '100%',
    borderRadius: 19,
    justifyContent: 'flex-end',
    paddingBottom: 4,
    overflow: 'hidden',
  },

  capsulaNumero: {
    width: '100%',
    textAlign: 'center',
    fontFamily: fontes.negrito,
    fontSize: 12,
  },

  capsulaRotulo: {
    fontFamily: fontes.regular,
    fontSize: 12,
    color: cores.marromClaro,
    marginTop: 2,
  },

  capsulaRotuloEscuro: {
    color: 'rgba(255, 234, 200, 0.75)',
  },

  capsulaRotuloHoje: {
    fontFamily: fontes.negrito,
    color: cores.marrom,
  },

  capsulaRotuloHojeEscuro: {
    color: cores.laranjaClaro,
  },

  capsulasNota: {
    fontFamily: fontes.regular,
    fontSize: 15,
    lineHeight: 22,
    color: cores.marromClaro,
    textAlign: 'center',
    paddingVertical: 14,
  },

  capsulasNotaEscuro: {
    color: 'rgba(255, 234, 200, 0.75)',
  },

  tituloSecao: {
    ...textos.tituloSecao,
    fontSize: 25,
    marginTop: 24,
    marginBottom: 12,
    lineHeight: 32,
  },

  semMargemTopo: {
    marginTop: 24,
  },

  linhaTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },

  duasColunas: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },

  cartaoMenor: {
    flex: 1,
    padding: 14,
    minHeight: 150,
    borderRadius: raio.bloco,
  },

  cartao: {
    marginBottom: 12,
    borderRadius: raio.bloco,
  },

  bolinha: {
    backgroundColor: cores.creme,
    borderWidth: 1,
    borderColor: cores.bordaCreme,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tituloCartao: {
    fontFamily: fontes.negrito,
    color: cores.marrom,
    fontSize: 28,
    marginBottom: 8,
  },

  numero: {
    fontFamily: fontes.negrito,
    fontSize: 20,
    color: cores.marrom,
    marginTop: 10,
  },

  destaque: {
    fontFamily: fontes.negrito,
    fontSize: 22,
    color: cores.laranja,
    marginVertical: 5,
  },

  textoSecundario: {
    fontFamily: fontes.regular,
    color: cores.marromClaro,
    fontSize: 15,
    lineHeight: 21,
  },

  detalhe: {
    fontFamily: fontes.regular,
    fontSize: 14,
    color: cores.marromClaro,
    marginTop: 5,
  },

  linhaIntervalo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },

  campo: {
    flex: 1,
    height: 50,
    borderWidth: 1.5,
    borderColor: cores.laranja,
    borderRadius: raio.campo,
    paddingHorizontal: 14,
    fontFamily: fontes.regular,
    fontSize: 16,
    color: cores.marrom,
    backgroundColor: cores.branco,
  },

  botaoDefinir: {
    minWidth: 0,
    marginTop: 0,
    paddingHorizontal: 22,
  },

  botaoPequeno: {
    minWidth: 0,
    height: 42,
    marginTop: 12,
    paddingHorizontal: 22,
  },

  grafico: {
    height: 150,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    gap: 6,
    paddingTop: 16,
  },

  coluna: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
  },

  numeroGrafico: {
    fontFamily: fontes.regular,
    color: cores.marromClaro,
    fontSize: 11,
    textAlign: 'center',
  },

  baseBarra: {
    height: 94,
    justifyContent: 'flex-end',
    width: '65%',
    maxWidth: 40,
  },

  barra: {
    width: '100%',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: cores.laranja,
  },

  rotuloGrafico: {
    fontFamily: fontes.regular,
    color: cores.marromClaro,
    fontSize: 11,
    marginTop: 5,
    textAlign: 'center',
  },

  filtros: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 24,
  },

  filtro: {
    backgroundColor: cores.creme,
    borderWidth: 1,
    borderColor: cores.bordaCreme,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: raio.chip,
  },

  filtroAtivo: {
    backgroundColor: cores.marrom,
    borderColor: cores.marrom,
  },

  textoFiltro: {
    fontFamily: fontes.regular,
    fontSize: 14,
    color: cores.marromClaro,
  },

  textoFiltroAtivo: {
    color: cores.fundo,
  },

  itemLista: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    gap: 12,
  },

  itemDivisor: {
    borderBottomWidth: 1,
    borderBottomColor: cores.bordaCreme,
  },

  textoItem: {
    flex: 1,
  },

  itemTitulo: {
    fontFamily: fontes.negrito,
    fontSize: 17,
    color: cores.marrom,
  },

    // ----- agenda -----
  agendaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: cores.branco,
    borderRadius: 22,
    paddingVertical: 11,
    paddingLeft: 11,
    paddingRight: 14,
    marginBottom: 10,
    ...sombra,
  },

  agendaBola: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },

  agendaBolaVacina: {
    backgroundColor: cores.laranja,
  },

  agendaBolaConsulta: {
    backgroundColor: cores.marrom,
  },

  agendaBolaOk: {
    backgroundColor: cores.laranjaClaro,
  },

  agendaTextos: {
    flex: 1,
    minWidth: 0,
  },

  agendaTitulo: {
    fontFamily: fontes.negrito,
    fontSize: 16,
    lineHeight: 22,
    color: cores.marrom,
  },

  agendaDetalhe: {
    fontFamily: fontes.regular,
    fontSize: 13,
    lineHeight: 18,
    color: cores.marromClaro,
  },

  selo: {
    borderRadius: raio.chip,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },

  seloAtrasado: {
    backgroundColor: cores.erro,
  },

  seloHoje: {
    backgroundColor: cores.laranja,
  },

  seloAmanha: {
    backgroundColor: cores.marrom,
  },

  seloDepois: {
    backgroundColor: 'rgba(51, 39, 22, 0.06)',
  },

  textoSelo: {
    fontFamily: fontes.negrito,
    fontSize: 12,
    lineHeight: 18,
  },

  textoSeloClaro: {
    color: cores.fundo,
  },

  textoSeloEscuro: {
    color: cores.marrom,
  },

  emUso: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    marginBottom: 12,
  },

  emUsoRotulo: {
    fontFamily: fontes.regular,
    fontSize: 14,
    color: cores.marromClaro,
  },

  emUsoPilula: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: cores.branco,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
    ...sombra,
  },

  emUsoTexto: {
    fontFamily: fontes.negrito,
    fontSize: 13,
    color: cores.marrom,
  },

  vazio: {
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },

  textoVazio: {
    fontFamily: fontes.regular,
    fontSize: 15,
    lineHeight: 21,
    color: cores.marromClaro,
    textAlign: 'center',
  },

  nota: {
    fontFamily: fontes.regular,
    color: cores.marromClaro,
    fontSize: 13,
    marginTop: 12,
    lineHeight: 19,
  },

  faixaErro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FBE4E4',
    borderRadius: raio.campo,
    padding: 12,
    marginBottom: 8,
  },

  textoErro: {
    flex: 1,
    fontFamily: fontes.regular,
    fontSize: 14,
    color: cores.erro,
  },

});