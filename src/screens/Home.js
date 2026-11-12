import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { buscarPet, obterPetSelecionadoId, definirPetSelecionadoId, obterPerfilTutor } from '../database/Database';

// usestate = guarda o pet que vai ser mostrado na home.
// usecallback = auxilia na execução da função de carregamento.
// usefocuseffect = atualiza os dados quando a home recebe o foco.
// asyncstorage = recupera e guarda a seleção do pet.

import { View, Text, StyleSheet, Pressable } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import PainelHome from '../componentes/PainelHome';

import TelaComTopo from '../componentes/TelaComTopo';
import AvatarPet from '../componentes/AvatarPet';
import Cartao from '../componentes/Cartao';
import Chip from '../componentes/Chip';
import Botao from '../componentes/Botao';
import { cores, fontes, textos } from '../styles/tema';
import logo from "../../assets/images/logo-ofc-png-empty1.0.png";

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

  const [nomeTutor, setNomeTutor] = useState("");
  const [carregando, setCarregando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;

      async function carregarPetSelecionado() {
        try {
          const idRecebido = petRecebido?.id_pet;
          const idAnterior = await obterPetSelecionadoId(db);

          let petAtualizado = idRecebido
            ? await buscarPet(db, idRecebido)
            : null;

          // se o pet recebido não existir mais, tenta recuperar o último selecionado.
          if (!petAtualizado && idAnterior) {
            petAtualizado = await buscarPet(db, idAnterior);
          }

          if (
            petAtualizado &&
            String(petAtualizado.id_pet) !== String(idAnterior)
          ) {
            await definirPetSelecionadoId(db, petAtualizado.id_pet);
          }

          const perfil = await obterPerfilTutor(db);

          if (idRecebido && petAtualizado) {
            await definirPetSelecionadoId(db, idRecebido);
          }

          if (ativo) {
            setPet(petAtualizado);
            setNomeTutor(perfil?.nome || "");
          }

        } catch (erro) {
          console.error("Erro ao carregar pet:", erro);

          if (ativo) {
            setPet(petRecebido || null);
          }
        }

        finally {
          if (ativo) {
            setCarregando(false);
          }
        }
      }

      carregarPetSelecionado();

      return () => {
        ativo = false;
      };

    }, [db, petRecebido?.id_pet])
  );

  function editarPet() {
    if (pet) {
      navigation.navigate("CadastroPets", {
        petParaEditar: pet
      });
    }
  }

  const idade = pet?.data_nascimento
    ? calcularIdade(pet.data_nascimento)
    : pet?.idade_Aproximada || "Idade não informada";

  const primeiroNome = nomeTutor.trim().split(" ")[0];

  const titulo = primeiroNome
    ? `Olá, ${primeiroNome}!`
    : "Olá, humano!";

  return (
    <TelaComTopo logo={logo}>
      <Text style={styles.saudacao}>{titulo}</Text>

      {pet ? (
        <Cartao style={styles.petCard}>
          <View style={styles.avatarBox}>
            <AvatarPet foto={pet.foto_perfil} tamanho={76} selecionado />

            <Pressable
              style={styles.badgeFoto}
              onPress={editarPet}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Editar foto e dados do pet"
            >
              <Ionicons name="camera" size={14} color={cores.fundo} />
            </Pressable>
          </View>

          <View style={styles.infoPet}>
            <Text style={textos.etiqueta}>SEU COMPANHEIRO</Text>

            <Text style={styles.nomePet} numberOfLines={1}>
              {pet.nome || "Meu pet"}
            </Text>

            <View style={styles.chips}>
              <Chip pequeno texto={pet.especie || "Pet"} icone="paw" />
              <Chip pequeno texto={idade} icone="calendar-outline" />
            </View>
          </View>

          <Pressable
            style={styles.botaoTrocar}
            onPress={() => navigation.navigate("ListaPets")}
            accessibilityRole="button"
            accessibilityLabel="Trocar de pet"
          >
            <Ionicons name="swap-horizontal" size={24} color={cores.marrom} />
          </Pressable>
        </Cartao>
      ) : (
        !carregando && (
          <Cartao style={styles.vazio}>
            <AvatarPet tamanho={96} />

            <Text style={styles.textoVazio}>
              Nenhum pet selecionado. Escolha um pet na lista para ver o resumo dos cuidados.
            </Text>

            <Botao
              titulo="Escolher pet"
              larga
              onPress={() => navigation.navigate("ListaPets")}
            />
          </Cartao>
        )
      )}

      <PainelHome
        pet={pet}
        onAbrirCuidados={() => navigation.navigate("PetPrivado")}
      />
    </TelaComTopo>
  );
}

const styles = StyleSheet.create({
  petCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 8,
    borderWidth: 0,
    borderRadius: 28,
  },

  infoPet: {
    flex: 1,
    minWidth: 0,
  },

  nomePet: {
    fontFamily: fontes.negrito,
    fontSize: 26,
    color: cores.marrom,
    lineHeight: 34,
    marginTop: 2,
  },

  dadosPet: {
    fontFamily: fontes.regular,
    fontSize: 18,
    lineHeight: 22,
    color: cores.marromClaro,
  },

  botaoTrocar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFEAC8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarBox: {
    width: 76,
    height: 76,
  },

  badgeFoto: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: cores.laranja,
    borderWidth: 2,
    borderColor: cores.fundo,
    alignItems: 'center',
    justifyContent: 'center',
  },

  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },

  vazio: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 28,
  },

  textoVazio: {
    fontFamily: fontes.regular,
    fontSize: 19,
    lineHeight: 26,
    color: cores.marromClaro,
    textAlign: 'center',
    marginTop: 16,
  },

  saudacao: {
    fontFamily: fontes.negrito,
    fontSize: 40,
    color: cores.marrom,
    textAlign: "center",
    marginBottom: 2,
  },

  chipBranco: {
    backgroundColor: cores.branco,
  },

})
