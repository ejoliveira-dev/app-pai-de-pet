import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { buscarPet, obterPetSelecionadoId, definirPetSelecionadoId } from '../database/Database';

// usestate = guarda o pet que vai ser mostrado na home.
// usecallback = auxilia na execução da função de carregamento.
// usefocuseffect = atualiza os dados quando a home recebe o foco.
// asyncstorage = recupera e guarda a seleção do pet.

import { View, Text, StyleSheet, ScrollView, Image, Pressable } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import PainelHome from '../componentes/PainelHome';

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
  const db = useSQLiteContext();

  const petRecebido = route.params?.petSelecionado;
  const [pet, setPet] = useState(petRecebido || null);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;

      async function carregarPetSelecionado() {
        try {
          const idRecebido = petRecebido?.id_pet;
          const idAnterior = await obterPetSelecionadoId(db);
          const idProcurado = idRecebido || idAnterior;

          const petAtualizado = idProcurado
            ? await buscarPet(db, idProcurado)
            : null;

          if (idRecebido && petAtualizado) {
            await definirPetSelecionadoId(db, idRecebido);
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

    }, [db, petRecebido?.id_pet])
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

        {/* painel de acompanhamento do pet */}
        <PainelHome
          pet={pet}
          onAbrirCuidados={() =>
            navigation.navigate('PetPrivado')
          }
        />

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
    color: '#75571F',
    marginBottom: 15,
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

});