import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// usestate = guarda o pet que vai ser mostrado na home.
// usecallback = auxilia na execução da função de carregamento.
// usefocuseffect = atualiza os dados quando a home recebe o foco.
// asyncstorage = recupera e guarda a seleção do pet.

import { View, Text, StyleSheet, ScrollView, Image, Pressable } from 'react-native';

import { Ionicons } from '@expo/vector-icons';


function calcularIdade(dataNascimento) {
  if (!dataNascimento) return "Idade não informada";

  // separa a data no formato DD/MM/AAAA
  const [dia, mes, ano] = dataNascimento.split("/").map(Number);

  const nascimento = new Date(ano, mes - 1, dia);
  const hoje = new Date();

  if (
    Number.isNaN(nascimento.getTime()) ||
    nascimento.getFullYear() !== ano ||
    nascimento.getMonth() !== mes - 1 ||
    nascimento.getDate() !== dia ||
    nascimento > hoje
  ) {
    return "Data de nascimento inválida";
  }

  // calcula os meses completos
  let totalMeses =
    (hoje.getFullYear() - ano) * 12 +
    (hoje.getMonth() - (mes - 1));

  if (hoje.getDate() < dia) {
    totalMeses--;
  }

  const anos = Math.floor(totalMeses / 12);
  const meses = totalMeses % 12;

  if (totalMeses === 0) {
    return "Menos de 1 mês";
  }

  if (anos === 0) {
    return `${meses} ${meses === 1 ? "mês" : "meses"}`;
  }

  if (meses === 0) {
    return `${anos} ${anos === 1 ? "ano" : "anos"}`;
  }

  return `${anos} ${anos === 1 ? "ano" : "anos"} e ${meses} ${meses === 1 ? "mês" : "meses"}`;
}


export default function Home({ navigation, route }) {
  const petRecebido = route.params?.petSelecionado;
  const [pet, setPet] = useState(petRecebido || null);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;

      async function carregarPetSelecionado() {
        try {
          // pra recuperar os pets que já foram cadastrados
          const dadosSalvos = await AsyncStorage.getItem("@tutus:pets");

          const lista = dadosSalvos
            ? JSON.parse(dadosSalvos)
            : [];

          if (!Array.isArray(lista)) {
            throw new Error("Lista de pets inválida");
          }

          // verificando se um pet foi selecionado
          const idRecebido = petRecebido?.id_pet;

          // recuperando a última seleção
          const idAnterior = await AsyncStorage.getItem(
            "@tutus:petSelecionadoId"
          );

          const idProcurado = idRecebido || idAnterior;

          // procura o pet entre os cadastrados
          const petAtualizado = lista.find(
            (item) => String(item.id_pet) === String(idProcurado)
          ) || null;

          // salva a seleção atual
          if (idRecebido && petAtualizado) {
            await AsyncStorage.setItem(
              "@tutus:petSelecionadoId",
              String(idRecebido)
            );
          }

          if (ativo) {
            setPet(petAtualizado);
          }

        } catch (erro) {
          console.error("Erro ao carregar pet:", erro);

          if (ativo) {
            setPet(petRecebido || null);
          }
        }
      }

      carregarPetSelecionado();

      return () => {
        ativo = false;
      };

    }, [petRecebido?.id_pet])
  );

  const idade = pet?.data_nascimento
    ? calcularIdade(pet.data_nascimento)
    : pet?.idade_Aproximada || "Idade não informada";

  return (
    <View style={styles.container}>

      <ScrollView
        contentContainerStyle={styles.conteudo}
        showsVerticalScrollIndicator={false}
      >

        {/* cabeçalho */}
        <View style={styles.blocoPet}>

          <Text style={styles.saudacao}>
            Olá, humano!
          </Text>

          <Text style={styles.subtitulo}>
            Veja como está seu pet hoje.
          </Text>

          {/* pet selecionado */}
          <View style={styles.petCard}>

            {pet?.foto_perfil ? (
              <Image
                source={{ uri: pet.foto_perfil }}
                style={styles.fotoPet}
              />
            ) : (
              <View
                style={[
                  styles.fotoPet,
                  {
                    backgroundColor: "#FFEAC8",
                    justifyContent: "center",
                    alignItems: "center",
                  },
                ]}
              >
                <Ionicons
                  name="paw"
                  size={30}
                  color="#FA9F2A"
                />
              </View>
            )}

            <View style={styles.infoPet}>

              <Text style={styles.nomePet}>
                {pet?.nome || "Nenhum pet selecionado"}
              </Text>

              <Text style={styles.dadosPet}>
                {pet
                  ? `${pet.especie} • ${idade}`
                  : "Escolha um pet na lista"}
              </Text>

            </View>

            <Pressable
              style={styles.botaoTrocar}
              onPress={() => navigation.navigate("ListaPets")}
            >
              <Ionicons
                name="swap-horizontal"
                size={24}
                color="#332716"
              />
            </Pressable>

          </View>

        </View>

        {/* resumo diário */}

        <Text style={styles.tituloSecao}>
          Resumo de hoje
        </Text>

        <Text style={styles.descricaoSecao}>
          Acompanhe os principais cuidados.
        </Text>

        <View style={styles.grade}>

          <View style={styles.cardResumo}>
            <Ionicons
              name="restaurant-outline"
              size={26}
              color="#332716"
            />
            <Text style={styles.tituloCard}>
              Alimentação
            </Text>
            <Text style={styles.textoCard}>
              Sem registro
            </Text>
          </View>

          <View style={styles.cardResumo}>
            <Ionicons
              name="stats-chart-outline"
              size={26}
              color="#332716"
            />
            <Text style={styles.tituloCard}>
              Peso
            </Text>
            <Text style={styles.textoCard}>
              Sem registro
            </Text>
          </View>

          <View style={styles.cardResumo}>
            <Ionicons
              name="medkit-outline"
              size={26}
              color="#332716"
            />
            <Text style={styles.tituloCard}>
              Vacinas
            </Text>
            <Text style={styles.textoCard}>
              Sem registro
            </Text>
          </View>

          <View style={styles.cardResumo}>
            <Ionicons
              name="medical-outline"
              size={26}
              color="#332716"
            />
            <Text style={styles.tituloCard}>
              Medicamentos
            </Text>
            <Text style={styles.textoCard}>
              Sem registro
            </Text>
          </View>

        </View>

        {/* próximos cuidados */}

        <Text style={styles.tituloSecao}>
          Próximos cuidados
        </Text>

        <View style={styles.cardCuidados}>
          <Ionicons
            name="calendar-outline"
            size={28}
            color="#FA9F2A"
          />

          <View style={styles.infoCuidado}>
            <Text style={styles.tituloCuidado}>
              Consultas e lembretes
            </Text>

            <Text style={styles.textoCuidado}>
              Nenhum cuidado agendado
            </Text>
          </View>
        </View>

      </ScrollView >
    </View >

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF8',
  },

  conteudo: {
    paddingHorizontal: 20,
    paddingTop: 35,
    paddingBottom: 35,
  },

  blocoPet: {
    backgroundColor: '#FA9F2A',
    borderRadius: 28,
    padding: 22,
    marginBottom: 28,
  },

  saudacao: {
    fontFamily: 'Ruwudu-Bold',
    fontSize: 30,
    color: '#332716',
  },

  subtitulo: {
    fontFamily: 'Ruwudu-Regular',
    fontSize: 17,
    color: '#332716',
    marginBottom: 18,
  },

  petCard: {
    backgroundColor: '#FFFDF8',
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },

  fotoPet: {
    width: 65,
    height: 65,
    borderRadius: 33,
    marginRight: 12,
  },

  infoPet: {
    flex: 1,
  },

  nomePet: {
    fontFamily: 'Ruwudu-Bold',
    fontSize: 23,
    color: '#332716',
  },

  dadosPet: {
    fontFamily: 'Ruwudu-Regular',
    fontSize: 15,
    color: '#75571F',
  },

  botaoTrocar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFEAC8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  tituloSecao: {
    fontFamily: 'Ruwudu-Bold',
    fontSize: 24,
    color: '#332716',
    marginBottom: 8,
  },

  descricaoSecao: {
    fontFamily: 'Ruwudu-Regular',
    fontSize: 16,
    color: '#75571F',
    marginBottom: 18,
  },

  grade: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 25,
  },

  cardResumo: {
    width: '48%',
    minHeight: 135,
    backgroundColor: '#FFEAC8',
    borderRadius: 20,
    padding: 15,
    marginBottom: 14,
    justifyContent: 'center',
  },

  tituloCard: {
    fontFamily: 'Ruwudu-Bold',
    fontSize: 18,
    color: '#332716',
    marginTop: 8,
  },

  textoCard: {
    fontFamily: 'Ruwudu-Regular',
    fontSize: 14,
    color: '#75571F',
  },

  cardCuidados: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EADFCB',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },

  infoCuidado: {
    marginLeft: 14,
    flex: 1,
  },

  tituloCuidado: {
    fontFamily: 'Ruwudu-Bold',
    fontSize: 18,
    color: '#332716',
  },

  textoCuidado: {
    fontFamily: 'Ruwudu-Regular',
    fontSize: 15,
    color: '#75571F',
  },
});