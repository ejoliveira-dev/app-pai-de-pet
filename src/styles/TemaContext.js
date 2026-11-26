import React, { createContext, useContext, useState, useEffect } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { cores as coresPadrao, paletas } from "./tema";
import { obterConfig, salvarConfig } from "../database/Database";

const TemaContext = createContext(null);

export function TemaProvider({ children }) {
  const db = useSQLiteContext();

  const [temaEscolhido, setTemaEscolhido] = useState("laranja");
  const [personalizacaoAtiva, setPersonalizacaoAtiva] = useState(false);

  useEffect(() => {
    async function carregarTema() {
      try {
        const [temaSalvo, ativa] = await Promise.all([
          obterConfig(db, "temaAplicativo"),
          obterConfig(db, "personalizacaoAtiva")
        ]);

        if (temaSalvo && paletas[temaSalvo]) {
          setTemaEscolhido(temaSalvo);
        }

        setPersonalizacaoAtiva(ativa === "true");
      } catch (erro) {
        console.error("Erro ao carregar tema:", erro);
      }
    }

    carregarTema();
  }, [db]);

  const tema = personalizacaoAtiva ? temaEscolhido : "laranja";
  const paleta = paletas[tema] || paletas.laranja;

  const cores = tema === "laranja"
    ? { ...coresPadrao, textoSobrePrincipal: coresPadrao.marrom }
    : {
        textoSobrePrincipal: ["roxo", "azul"].includes(tema) ? "#FFFFFF" : paleta[0],
        
    ...coresPadrao,
    marrom: paleta[0],
    marromClaro: paleta[1],
    laranja: paleta[2],
    terracota: paleta[3],
    laranjaClaro: tema === "escuro" ? "#E0E0E0" : paleta[4],
    fundo: paleta[4],
    branco: tema === "escuro" ? "#242424" : "#FFFFFF",
    creme: tema === "escuro" ? "#303030" : paleta[4],
    bordaCreme: paleta[3],
    bordaCartao: paleta[3],
    borda: paleta[3],
    erro: tema === "escuro" ? "#FF7777" : "#A52C2C",
  };

  async function alterarTema(novoTema) {
    if (!paletas[novoTema]) return;

    try {
      await salvarConfig(db, "temaAplicativo", novoTema);
      setTemaEscolhido(novoTema);
    } catch (erro) {
      console.error("Erro ao salvar tema:", erro);
    }
  }

  async function alternarPersonalizacao(valor) {
    try {
      await salvarConfig(db, "personalizacaoAtiva", String(valor));
      setPersonalizacaoAtiva(valor);
    } catch (erro) {
      console.error("Erro ao salvar personalização:", erro);
    }
  }

  return (
    <TemaContext.Provider value={{
      tema,
      temaEscolhido,
      cores,
      alterarTema,
      personalizacaoAtiva,
      alternarPersonalizacao
    }}>
      {children}
    </TemaContext.Provider>
  );
}

export function useTema() {
  const contexto = useContext(TemaContext);

  if (!contexto) {
    throw new Error("useTema precisa estar dentro de TemaProvider");
  }

  return contexto;
}