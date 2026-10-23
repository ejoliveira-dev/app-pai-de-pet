
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// Estrutura inicial do painel
const VAZIO = {
  alimentacao: [],
  peso: [],
  vacinas: [],
  consultas: [],
  medicamentos: []
};

// Recupera uma lista salva no AsyncStorage
function listaSegura(valor) {
  if (!valor) return [];

  const resultado = JSON.parse(valor);

  return Array.isArray(resultado) ? resultado : [];
}

// Converte datas DD/MM/AAAA
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

// Converte a data de cada registro
function dataRegistro(texto) {
  const data = new Date(texto);

  return Number.isNaN(data.getTime()) ? null : data;
}

// Identifica um dia específico
function chaveDia(data) {
  return `${data.getFullYear()}-${data.getMonth()}-${data.getDate()}`;
}

// Formata números para o padrão brasileiro
function numeroBR(valor) {
  return Number(valor).toLocaleString('pt-BR', {
    maximumFractionDigits: 2
  });
}

// Componente reutilizável para os gráficos
function Grafico({ titulo, pontos, unidade }) {

  const maximo = Math.max(
    1,
    ...pontos.map(item => item.valor)
  );

  const temDados = pontos.some(item => item.valor > 0);

  return (
    <View style={styles.cartao}>

      <Text style={styles.tituloCartao}>
        {titulo}
      </Text>

      {!temDados ? (
        <Text style={styles.textoSecundario}>
          Ainda não há registros para mostrar.
        </Text>
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

    </View>
  );
}

// Componente principal da Home
export default function PainelHome({
  pet,
  onAbrirCuidados
}) {

  const id = pet?.id_pet;

  const [dados, setDados] = useState(VAZIO);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const [periodo, setPeriodo] = useState(7);
  const [intervalo, setIntervalo] = useState(null);
  const [horasTexto, setHorasTexto] = useState('');

  const [agora, setAgora] = useState(Date.now());

  // Atualiza o relógio a cada minuto
  useEffect(() => {

    const relogio = setInterval(
      () => setAgora(Date.now()),
      60000
    );

    return () => clearInterval(relogio);

  }, []);

  // Recupera os dados do pet selecionado
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

          const [
            registros,
            vacinas,
            consultas,
            medicamentos,
            horas
          ] = await Promise.all([

            AsyncStorage.getItem(
              `@tutus:registros:${id}`
            ),

            AsyncStorage.getItem(
              `@tutus:vacinas:${id}`
            ),

            AsyncStorage.getItem(
              `@tutus:cuidados:consulta:${id}`
            ),

            AsyncStorage.getItem(
              `@tutus:cuidados:medicamento:${id}`
            ),

            AsyncStorage.getItem(
              `@tutus:intervaloAlimentacao:${id}`
            )

          ]);

          const historico = registros
            ? JSON.parse(registros)
            : {};

          const intervaloSalvo = Number(horas);

          if (ativo) {

            setDados({

              alimentacao: Array.isArray(historico.alimentacao)
                ? historico.alimentacao
                : [],

              peso: Array.isArray(historico.peso)
                ? historico.peso
                : [],

              vacinas: listaSegura(vacinas),

              consultas: listaSegura(consultas),

              medicamentos: listaSegura(medicamentos)

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

    }, [id])
  );

  // Salva o intervalo entre refeições
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

      await AsyncStorage.setItem(
        `@tutus:intervaloAlimentacao:${id}`,
        entrada
      );

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

  // Calcula as informações apresentadas na Home
  const calculos = useMemo(() => {

    const hoje = new Date(agora);
    hoje.setHours(0, 0, 0, 0);

    const chaveHoje = chaveDia(hoje);

    // Alimentação
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

    // Gráfico de alimentação dos últimos 7 dias
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

    // Gráfico dos últimos 5 pesos registrados
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

    // Consultas e vacinas pendentes
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

    // Filtro de 7 ou 30 dias
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

    // Medicamentos em uso
    const medicamentosAtivos = dados.medicamentos.filter(
      item => !item.concluido
    );

    // Lembretes dos próximos 3 dias
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

  // Mensagem se não houver pet selecionado
  if (!pet) {

    return (
      <Text style={styles.textoSecundario}>
        Selecione um pet para visualizar seu resumo.
      </Text>
    );
  }

  return (

    <View style={styles.painel}>

      {carregando && (
        <Text style={styles.textoSecundario}>
          Atualizando informações...
        </Text>
      )}

      {!!erro && (
        <Text style={styles.erro}>
          {erro}
        </Text>
      )}

      {/* RESUMO DO DIA */}
      <Text style={styles.tituloSecao}>
        Resumo de hoje
      </Text>

      <View style={styles.duasColunas}>

        {/* Alimentação */}
        <View style={styles.cartaoMenor}>

          <Ionicons
            name="restaurant-outline"
            size={22}
            color="#80502D"
          />

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

        </View>

        {/* Peso */}
        <View style={styles.cartaoMenor}>

          <Ionicons
            name="scale-outline"
            size={22}
            color="#80502D"
          />

          <Text style={styles.numero}>
            {calculos.ultimoPeso
              ? `${numeroBR(calculos.ultimoPeso.valor)} kg`
              : 'Sem registro'}
          </Text>

          <Text style={styles.textoSecundario}>
            Último peso registrado
          </Text>

        </View>

      </View>

      {/* PRÓXIMA REFEIÇÃO */}
      <View style={styles.cartao}>

        <Text style={styles.tituloCartao}>
          Próxima refeição
        </Text>

        <Text style={styles.destaque}>
          {calculos.proximaRefeicao}
        </Text>

        <Text style={styles.textoSecundario}>
          Previsão calculada pelo intervalo que você escolher após o último registro. Não é uma recomendação veterinária.
        </Text>

        <View style={styles.linhaIntervalo}>

          <TextInput
            style={styles.campo}
            value={horasTexto}
            onChangeText={setHorasTexto}
            placeholder="Intervalo em horas"
            placeholderTextColor="#8B7D6E"
            keyboardType="number-pad"
            maxLength={2}
          />

          <Pressable
            style={styles.botao}
            onPress={salvarIntervalo}
          >
            <Text style={styles.textoBotao}>
              Definir
            </Text>
          </Pressable>

        </View>

        <Pressable
          onPress={onAbrirCuidados}
          style={styles.link}
        >
          <Text style={styles.textoLink}>
            Registrar alimentação ou peso →
          </Text>
        </Pressable>

      </View>

      {/* GRÁFICOS */}
      <Text style={styles.tituloSecao}>
        Acompanhamento
      </Text>

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

        <Text style={styles.tituloSecao}>
          Consultas e vacinas
        </Text>

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

      <View style={styles.cartao}>

        {calculos.proximos.length === 0 ? (

          <Text style={styles.textoSecundario}>
            Nenhuma consulta ou vacina pendente nos próximos {periodo} dias.
          </Text>

        ) : (

          calculos.proximos.map(item => (

            <View
              key={item.id}
              style={styles.itemLista}
            >

              <Ionicons
                name={
                  item.tipo === 'Vacina'
                    ? 'medkit-outline'
                    : 'calendar-outline'
                }
                size={20}
                color="#80502D"
              />

              <View style={styles.textoItem}>

                <Text style={styles.itemTitulo}>
                  {item.nome}
                </Text>

                <Text style={styles.textoSecundario}>
                  {item.tipo} • {item.data.toLocaleDateString('pt-BR')}
                </Text>

              </View>

            </View>

          ))

        )}

      </View>

      {/* MEDICAMENTOS */}
      <Text style={styles.tituloSecao}>
        Medicamentos
      </Text>

      <View style={styles.cartao}>

        {calculos.medicamentosAtivos.length === 0 ? (

          <Text style={styles.textoSecundario}>
            Nenhum medicamento marcado como em uso.
          </Text>

        ) : (

          calculos.medicamentosAtivos.map(item => (

            <View
              key={String(item.id)}
              style={styles.itemLista}
            >

              <Ionicons
                name="medical-outline"
                size={20}
                color="#80502D"
              />

              <View style={styles.textoItem}>

                <Text style={styles.itemTitulo}>
                  {item.nome}
                </Text>

                <Text style={styles.textoSecundario}>
                  {item.detalhes || 'Sem dosagem informada'}
                </Text>

              </View>

            </View>

          ))

        )}

      </View>

      {/* LEMBRETES */}
      <Text style={styles.tituloSecao}>
        Lembretes
      </Text>

      <View style={styles.cartao}>

        {calculos.lembretes.length === 0 ? (

          <Text style={styles.textoSecundario}>
            Nenhum lembrete urgente nos registros.
          </Text>

        ) : (

          calculos.lembretes.map(item => (

            <View
              key={item.id}
              style={styles.itemLista}
            >

              <Ionicons
                name="notifications-outline"
                size={20}
                color="#80502D"
              />

              <View style={styles.textoItem}>

                <Text style={styles.itemTitulo}>
                  {item.nome}
                </Text>

                <Text style={styles.textoSecundario}>
                  {item.tipo} • {item.data.toLocaleDateString('pt-BR')}

                  {item.data < new Date(
                    new Date(agora).setHours(0, 0, 0, 0)
                  )
                    ? ' • Atrasado'
                    : ''}
                </Text>

              </View>

            </View>

          ))

        )}

        <Text style={styles.nota}>
          {calculos.atrasados.length} cuidado(s) pendente(s) com data passada. Lembretes apenas dentro do aplicativo; sem notificações automáticas.
        </Text>

      </View>

    </View>
  );
}

// ESTILOS DO PAINEL
const styles = StyleSheet.create({

  painel: {
    marginTop: 5,
  },

  tituloSecao: {
    fontFamily: 'Ruwudu-Bold',
    fontSize: 22,
    color: '#332716',
    marginTop: 19,
    marginBottom: 12,
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
  },

  cartaoMenor: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EADFCB',
    borderRadius: 18,
    padding: 14,
    minHeight: 128,
  },

  cartao: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EADFCB',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },

  tituloCartao: {
    fontFamily: 'Ruwudu-Bold',
    color: '#332716',
    fontSize: 18,
    marginBottom: 8,
  },

  numero: {
    fontSize: 18,
    color: '#332716',
    fontWeight: '700',
    marginTop: 8,
  },

  destaque: {
    fontSize: 19,
    color: '#80502D',
    fontWeight: '700',
    marginVertical: 5,
  },

  textoSecundario: {
    color: '#75571F',
    fontSize: 13,
    lineHeight: 19,
  },

  detalhe: {
    fontSize: 12,
    color: '#75571F',
    marginTop: 5,
  },

  linhaIntervalo: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },

  campo: {
    borderWidth: 1,
    borderColor: '#D7C9B7',
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 43,
    color: '#332716',
    flex: 1,
  },

  botao: {
    backgroundColor: '#80502D',
    borderRadius: 12,
    paddingHorizontal: 15,
    justifyContent: 'center',
  },

  textoBotao: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  link: {
    paddingTop: 15,
    paddingBottom: 3,
  },

  textoLink: {
    color: '#80502D',
    fontWeight: '700',
    fontSize: 14,
  },

  grafico: {
    height: 145,
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
    color: '#75571F',
    fontSize: 10,
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
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    backgroundColor: '#DCA360',
  },

  rotuloGrafico: {
    color: '#75571F',
    fontSize: 10,
    marginTop: 5,
    textAlign: 'center',
  },

  filtros: {
    flexDirection: 'row',
    gap: 5,
  },

  filtro: {
    borderWidth: 1,
    borderColor: '#EADFCB',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
  },

  filtroAtivo: {
    backgroundColor: '#80502D',
    borderColor: '#80502D',
  },

  textoFiltro: {
    fontSize: 12,
    color: '#80502D',
  },

  textoFiltroAtivo: {
    color: '#FFFFFF',
  },

  itemLista: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    gap: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F2EAE0',
  },

  textoItem: {
    flex: 1,
  },

  itemTitulo: {
    fontSize: 15,
    color: '#332716',
    fontWeight: '600',
  },

  nota: {
    color: '#75571F',
    fontSize: 12,
    marginTop: 13,
    lineHeight: 18,
  },

  erro: {
    color: '#AD3A32',
    marginBottom: 8,
  },

});
