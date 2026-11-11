import React from "react";
import { View, Text, Image, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cores, fontes } from "../styles/tema";


const ALTURA_TOPO_BAIXO = 92; // altura da parte laranja no modo com logo
const TAMANHO_LOGO = 120;      // largura e altura da logo


const MOLDURA_LOGO = "quadrado";
const SOBREPOSICAO = 28;
export default function TelaComTopo({ titulo, subtitulo, direita, children, rolagem = true, logo }) {
  const insets = useSafeAreaInsets();
  const comLogo = !!logo;

  const linha = insets.top + ALTURA_TOPO_BAIXO - SOBREPOSICAO;

  const estiloConteudo = [
    estilos.conteudo,
    comLogo && { paddingTop: TAMANHO_LOGO / 2 + 14 },
  ];

  const Moldura = comLogo ? ScrollView : React.Fragment;
  const propsMoldura = comLogo
    ? {
      contentContainerStyle: { flexGrow: 1 },
      showsVerticalScrollIndicator: false,
      keyboardShouldPersistTaps: "handled",
      bounces: false,
      overScrollMode: "never",
    }
    : {};

  return (
    <View style={estilos.tela}>
      <Moldura {...propsMoldura}>
        {comLogo ? (
          <View style={[estilos.topoBaixo, { height: insets.top + ALTURA_TOPO_BAIXO }]}>
            <View style={estilos.circulo} />
            {direita ? (
              <View style={[estilos.direitaBaixo, { top: insets.top + 10 }]}>{direita}</View>
            ) : null}
          </View>
        ) : (
          <View style={[estilos.topo, { paddingTop: insets.top + 24 }]}>
            <View style={estilos.circulo} />

            <View style={estilos.linhaTopo}>
              <View style={{ flex: 1 }}>
                <Text style={estilos.titulo}>{titulo}</Text>
                {subtitulo ? <Text style={estilos.subtitulo}>{subtitulo}</Text> : null}
              </View>
              {direita}
            </View>
          </View>
        )}

        <View style={estilos.painel}>
          {rolagem && !comLogo ? (
            <ScrollView
              contentContainerStyle={estiloConteudo}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
          ) : (
            <View style={[estiloConteudo, { flex: 1 }]}>{children}</View>
          )}
        </View>

        {/* logo no centro, metade no laranja e metade no claro */}
        {comLogo ? (
          <View
            style={[estilos.faixaLogo, { top: linha - TAMANHO_LOGO / 2 }]}
            pointerEvents="none"
          >
            {MOLDURA_LOGO === "nenhuma" ? (
              <Image source={logo} style={estilos.logoSolta} resizeMode="contain" />
            ) : (
              <View style={estilos.quadradoLogo}>
                <Image source={logo} style={estilos.logo} resizeMode="contain" />
              </View>
            )}
          </View>
        ) : null}

      </Moldura>

      {/* faixa laranja fixa atrás da barra de status */}
      {comLogo ? (
        <View
          style={[estilos.faixaStatus, { height: insets.top }]}
          pointerEvents="none"
        >
          <View style={estilos.circulo} />
        </View>
      ) : null}

    </View>
  );
}

const estilos = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: cores.laranja,
  },

  faixaStatus: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: cores.laranja,
    overflow: "hidden",
  },

  topo: {
    paddingBottom: 38,
    paddingHorizontal: 30,
    overflow: "hidden",
  },

  topoBaixo: {
    overflow: "hidden",
  },

  direitaBaixo: {
    position: "absolute",
    right: 20,
  },

  circulo: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: cores.laranjaClaro,
    opacity: 0.3,
  },

  linhaTopo: {
    flexDirection: "row",
    alignItems: "center"
  },

  titulo: {
    fontFamily: fontes.negrito,
    fontSize: 40,
    color: cores.marrom
  },

  subtitulo: {
    fontFamily: fontes.regular,
    fontSize: 20,
    lineHeight: 28,
    color: cores.marrom,
    marginTop: 4,
  },

  painel: {
    flex: 1,
    backgroundColor: cores.fundo,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -SOBREPOSICAO,
    overflow: "hidden",
  },

  conteudo: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 30,
  },

  faixaLogo: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },

  quadradoLogo: {
    width: TAMANHO_LOGO * 1.016,
    height: TAMANHO_LOGO,
    borderRadius: 22,
    backgroundColor: cores.fundo,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: cores.marrom,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },

  logoSolta: {
    width: TAMANHO_LOGO,
    height: TAMANHO_LOGO,
  },

  logo: {
    width: TAMANHO_LOGO * 1.2,
    height: TAMANHO_LOGO * 1,
  },
});