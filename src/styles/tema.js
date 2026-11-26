// Temas de cores do Tutus

export const paletas = {
  laranja: ["#332716", "#75571F", "#FA9F2A", "#D18B5F", "#FFEAC8"],
  rosa: ["#331C26", "#75284B", "#FA28AC", "#D17AA5", "#FFBADA"],
  roxo: ["#331C23", "#700549", "#5A2A79", "#B8A2D1", "#F2EBFF"],
  azul: ["#261F33", "#211770", "#00418D", "#95AAD1", "#D4EBFF"],
  verde: ["#233327", "#347064", "#0DBA71", "#8FD1C8", "#D9FFEE"],
};

// Cores do tema padrão

export const cores = {
  fundo: "#FFFDF8",
  branco: "#FFFFFF",
  laranja: "#FA9F2A",
  laranjaClaro: "#FFEAC8",
  creme: "#FFF1DC",
  bordaCreme: "#F2DFC4",
  bordaCartao: "#F5D7A8",
  marrom: "#332716",
  marromClaro: "#75571F",
  terracota: "#D18B5F",
  borda: "#C9B89D",
  erro: "#A52C2C",
};

// Fontes

export const fontes = {
  negrito: "Ruwudu-Bold",
  regular: "Ruwudu-Regular",
};

export const espaco = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };

export const raio = {
  campo: 15,
  chip: 20,
  bloco: 25,
  cartao: 30,
  cartaoGrande: 36,
  botao: 30,
};

export const sombra = {
  shadowColor: cores.marrom,
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.09,
  shadowRadius: 12,
  elevation: 4,
};

export const textos = {
  titulo: { fontFamily: fontes.negrito, fontSize: 30, color: cores.marrom },
  subtitulo: { fontFamily: fontes.regular, fontSize: 17, color: cores.marromClaro },
  label: { fontFamily: fontes.negrito, fontSize: 17, color: cores.marrom },
  tituloSecao: { fontFamily: fontes.negrito, fontSize: 26, color: cores.marrom },
  etiqueta: {
    fontFamily: fontes.negrito,
    fontSize: 14,
    letterSpacing: 2,
    color: cores.laranja,
  },
};