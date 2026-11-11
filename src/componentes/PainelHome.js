import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useSQLiteContext } from 'expo-sqlite';

import { carregarResumoPet, salvarIntervaloAlimentacao } from '../database/Database';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import Cartao from './Cartao';
import Botao from './Botao';
import { cores, fontes, raio, textos } from '../styles/tema';

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

// linha de lista (vacina, consulta, medicamento, lembrete).
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

// componente reutilizável para os gráficos.
function Grafico({ titulo, pontos, unidade }) {

  const maximo = Math.max(
    1,
    ...pontos.map(item => item.valor)
  );

  const temDados = pontos.some(item => item.valor > 0);

  return (
    <Cartao style={styles.cartao}>

      <Text style={styles.tituloCartao}>
        {titulo}
      </Text>

      {!temDados ? (
        <Vazio
          icone="bar-chart-outline"
          texto="Ainda não há registros para mostrar."
        />
      ) : (

        <View style={styles.grafico}>

          {pontos.map((item, indice) => (

            <View
              key={`${item.label}-${indice}`}
              style={styles.coluna}
            >

              <Text
                style={styles.numeroGrafico}
                numberOfLines={1}
              >
                {numeroBR(item.valor)}{unidade}
              </Text>

              <View style={styles.baseBarra}>

                <View
                  style={[
                    styles.barra,
                    {
                      height: Math.max(
                        5,
                        (item.valor / maximo) * 90
                      )
                    }
                  ]}
                />

              </View>

              <Text style={styles.rotuloGrafico}>
                {item.label}
              </Text>

            </View>

          ))}

        </View>

      )}

    </Cartao>
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

  // Contagem até a próxima refeição
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

    return {
      estado: falta <= 0 ? 'passou' : 'contando',
      texto: falta <= 0 ? 'Hora de comer!' : `em ${tempo}`,
      fracao: Math.min(1, Math.max(0, (agora - inicio) / duracao)),
      ultima: quando(new Date(inicio), agora),
      prevista: quando(new Date(inicio + duracao), agora),
    };

  }, [dados, agora, intervalo]);

  // Mensagem se não houver pet selecionado
  if (!pet) {

    return (
      <Vazio
        icone="paw-outline"
        texto="Selecione um pet para visualizar seu resumo."
      />
    );
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
      <View style={styles.heroi}>

        <View style={styles.heroiTopo}>

          <View style={styles.heroiIcone}>
            <Ionicons name="restaurant-outline" size={20} color={cores.marrom} />
          </View>

          <View style={styles.heroiRotuloLinha}>
            <Text style={styles.heroiRotulo} numberOfLines={1}>
              Próxima refeição
            </Text>

            <Pressable
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Como a previsão funciona"
              onPress={() => Alert.alert(
                'Como funciona',
                'A previsão soma o intervalo que você escolheu ao horário da última refeição registrada. Não é uma recomendação veterinária.'
              )}
            >
              <Ionicons name="information-circle-outline" size={18} color={cores.marromClaro} />
            </Pressable>
          </View>

          {intervalo && !escolhendoIntervalo ? (
            <Pressable
              style={styles.chipIntervalo}
              onPress={() => setEscolhendoIntervalo(true)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Mudar o intervalo entre refeições"
            >
              <Text style={styles.textoChipIntervalo}>
                a cada {intervalo}h
              </Text>
              <Ionicons name="pencil" size={13} color={cores.marrom} />
            </Pressable>
          ) : null}

        </View>

        {!intervalo || escolhendoIntervalo ? (
          <>
            <Text style={styles.heroiPergunta}>
              De quanto em quanto tempo?
            </Text>

            <View style={styles.opcoesIntervalo}>
              {OPCOES_INTERVALO.map(horas => (
                <Pressable
                  key={horas}
                  onPress={() => escolherIntervalo(horas)}
                  accessibilityRole="button"
                  accessibilityLabel={`A cada ${horas} horas`}
                  style={({ pressed }) => [
                    styles.opcaoIntervalo,
                    intervalo === horas && styles.opcaoIntervaloAtiva,
                    pressed && styles.pressionado
                  ]}
                >
                  <Text
                    style={[
                      styles.textoOpcaoIntervalo,
                      intervalo === horas && styles.textoOpcaoIntervaloAtiva
                    ]}
                  >
                    {horas}h
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : refeicao.estado === 'semRegistro' ? (
          <Pressable
            style={styles.heroiLink}
            onPress={onAbrirCuidados}
            accessibilityRole="button"
          >
            <Text style={styles.heroiPergunta}>
              Registre a primeira refeição
            </Text>
            <Ionicons name="chevron-forward" size={20} color={cores.marrom} />
          </Pressable>
        ) : (
          <>
            <Text style={styles.heroiGrande}>
              {refeicao.texto}
            </Text>

            <View style={styles.barraFundo}>
              <View
                style={[
                  styles.barraCheia,
                  { width: `${Math.round(refeicao.fracao * 100)}%` }
                ]}
              />
            </View>

            <View style={styles.barraPontas}>
              <Text style={styles.heroiLegenda}>
                comeu {refeicao.ultima}
              </Text>
              <Text style={styles.heroiLegenda}>
                prevista {refeicao.prevista}
              </Text>
            </View>
          </>
        )}

      </View>

      <View style={styles.duasColunas}>

        {/* Alimentação */}
        <Cartao style={styles.cartaoMenor}>

          <Bolinha nome="restaurant-outline" />

          <Text style={styles.numero}>
            {calculos.quantidadeHoje
              ? 'Registrada'
              : 'Sem registro'}
          </Text>

          <Text style={styles.textoSecundario}>
            Alimentação hoje
          </Text>

          <Text style={styles.detalhe}>
            {numeroBR(calculos.totalHoje)} g • {calculos.quantidadeHoje} registro(s)
          </Text>

        </Cartao>

        {/* Peso */}
        <Cartao style={styles.cartaoMenor}>

          <Bolinha nome="scale-outline" />

          <Text style={styles.numero}>
            {calculos.ultimoPeso
              ? `${numeroBR(calculos.ultimoPeso.valor)} kg`
              : 'Sem registro'}
          </Text>

          <Text style={styles.textoSecundario}>
            Último peso registrado
          </Text>

        </Cartao>

      </View>

      {/* GRÁFICOS */}
      <TituloSecao>Acompanhamento</TituloSecao>

      <Grafico
        titulo="Alimentação • últimos 7 dias"
        pontos={calculos.alimentacaoSemana}
        unidade="g"
      />

      <Grafico
        titulo="Peso • últimos 5 registros"
        pontos={calculos.pesoHistorico}
        unidade="kg"
      />

      {/* CONSULTAS E VACINAS */}
      <View style={styles.linhaTitulo}>

        <TituloSecao style={styles.semMargemTopo}>
          Consultas e vacinas
        </TituloSecao>

        <View style={styles.filtros}>

          {[7, 30].map(dias => (

            <Pressable
              key={dias}
              onPress={() => setPeriodo(dias)}
              style={[
                styles.filtro,
                periodo === dias && styles.filtroAtivo
              ]}
            >
              <Text
                style={[
                  styles.textoFiltro,
                  periodo === dias && styles.textoFiltroAtivo
                ]}
              >
                {dias === 7 ? '7 dias' : '30 dias'}
              </Text>
            </Pressable>

          ))}

        </View>

      </View>

      <Cartao style={styles.cartao}>

        {calculos.proximos.length === 0 ? (

          <Vazio
            icone="calendar-outline"
            texto={`Nenhuma consulta ou vacina pendente nos próximos ${periodo} dias.`}
            acao="Ir para Cuidados"
            onAcao={onAbrirCuidados}
          />

        ) : (

          calculos.proximos.map((item, i) => (

            <ItemLista
              key={item.id}
              icone={item.tipo === 'Vacina' ? 'medkit-outline' : 'calendar-outline'}
              titulo={item.nome}
              detalhe={`${item.tipo} • ${item.data.toLocaleDateString('pt-BR')}`}
              ultimo={i === calculos.proximos.length - 1}
            />

          ))

        )}

      </Cartao>

      {/* MEDICAMENTOS */}
      <TituloSecao>Medicamentos</TituloSecao>

      <Cartao style={styles.cartao}>

        {calculos.medicamentosAtivos.length === 0 ? (

          <Vazio
            icone="medical-outline"
            texto="Nenhum medicamento marcado como em uso."
            acao="Adicionar medicamento"
            onAcao={onAbrirCuidados}
          />

        ) : (

          calculos.medicamentosAtivos.map((item, i) => (

            <ItemLista
              key={String(item.id)}
              icone="medical-outline"
              titulo={item.nome}
              detalhe={item.detalhes || 'Sem dosagem informada'}
              ultimo={i === calculos.medicamentosAtivos.length - 1}
            />

          ))

        )}

      </Cartao>

      {/* LEMBRETES */}
      <TituloSecao>Lembretes</TituloSecao>

      <Cartao style={styles.cartao}>

        {calculos.lembretes.length === 0 ? (

          <Vazio
            icone="notifications-outline"
            texto="Nenhum lembrete urgente nos registros."
          />

        ) : (

          calculos.lembretes.map((item, i) => (

            <ItemLista
              key={item.id}
              icone="notifications-outline"
              titulo={item.nome}
              detalhe={`${item.tipo} • ${item.data.toLocaleDateString('pt-BR')}`}
              atrasado={item.data < inicioHoje}
              ultimo={i === calculos.lembretes.length - 1}
            />

          ))

        )}

        <Text style={styles.nota}>
          {calculos.atrasados.length} cuidado(s) pendente(s) com data passada. Lembretes apenas dentro do aplicativo; sem notificações automáticas.
        </Text>

      </Cartao>

    </View>
  );
}

const styles = StyleSheet.create({

  painel: {
    marginTop: 5,
  },

  // "Hoje" = cartão da próxima refeição.
  dataHoje: {
    fontFamily: fontes.regular,
    fontSize: 14,
    lineHeight: 20,
    color: cores.marromClaro,
    marginTop: 12,
  },

  heroi: {
    backgroundColor: cores.laranjaClaro,
    borderRadius: 26,
    padding: 16,
    marginBottom: 12,
  },

  heroiTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  heroiIcone: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: cores.fundo,
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroiRotuloLinha: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  heroiRotulo: {
    flexShrink: 1,
    fontFamily: fontes.regular,
    fontSize: 14,
    lineHeight: 20,
    color: cores.marromClaro,
  },

  chipIntervalo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 30,
    paddingHorizontal: 11,
    borderRadius: 15,
    backgroundColor: cores.fundo,
  },

  textoChipIntervalo: {
    fontFamily: fontes.negrito,
    fontSize: 13,
    lineHeight: 18,
    color: cores.marrom,
  },

  heroiGrande: {
    fontFamily: fontes.negrito,
    fontSize: 30,
    lineHeight: 40,
    color: cores.marrom,
    marginTop: 10,
  },

  heroiPergunta: {
    fontFamily: fontes.negrito,
    fontSize: 20,
    lineHeight: 28,
    color: cores.marrom,
    marginTop: 12,
  },

  heroiLink: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },

  barraFundo: {
    height: 10,
    borderRadius: 5,
    backgroundColor: cores.fundo,
    marginTop: 8,
    overflow: 'hidden',
  },

  barraCheia: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: cores.laranja,
  },

  barraPontas: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },

  heroiLegenda: {
    fontFamily: fontes.regular,
    fontSize: 13,
    lineHeight: 18,
    color: cores.marromClaro,
  },

  opcoesIntervalo: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },

  opcaoIntervalo: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: cores.fundo,
  },

  opcaoIntervaloAtiva: {
    backgroundColor: cores.marrom,
  },

  textoOpcaoIntervalo: {
    fontFamily: fontes.negrito,
    fontSize: 15,
    lineHeight: 20,
    color: cores.marrom,
  },

  textoOpcaoIntervaloAtiva: {
    color: cores.fundo,
  },

  pressionado: {
    opacity: 0.6,
    transform: [{ scale: 0.96 }],
  },

  tituloSecao: {
    ...textos.tituloSecao,
    fontSize: 24,
    marginTop: 24,
    marginBottom: 12,
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
    fontSize: 20,
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

  selo: {
    backgroundColor: '#FBE4E4',
    borderRadius: raio.chip,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },

  textoSelo: {
    fontFamily: fontes.negrito,
    fontSize: 12,
    color: cores.erro,
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