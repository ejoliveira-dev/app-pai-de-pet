import React, { useEffect, useState } from "react";
import { Modal, View, Text, StyleSheet, Alert as AlertNativo } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import Botao from "./Botao";
import { cores, fontes, sombra } from "../styles/tema";

let mostrarNaTela = null;

function alertar(titulo, mensagem, botoes) {
    const lista = botoes && botoes.length ? botoes : [{ text: "OK" }];

    if (mostrarNaTela) {
        mostrarNaTela({ titulo, mensagem, botoes: lista });
    } else {
        // reserva: se o componente ainda não estiver na tela, usa o alerta padrão
        AlertNativo.alert(titulo, mensagem, botoes);
    }
}

export const Alert = { alert: alertar };

// escolhe o ícone do topo pelo tipo de alerta
function escolherIcone(alerta) {
    if (alerta.botoes.some((botao) => botao.style === "destructive")) {
        return { nome: "trash-outline", fundo: cores.erro, cor: cores.branco };
    }

    if (/erro|inválid|ops|atenção|diferentes|vazia|selecione/i.test(alerta.titulo || "")) {
        return { nome: "alert", fundo: cores.marrom, cor: cores.laranja };
    }

    return { nome: "paw", fundo: cores.laranja, cor: cores.marrom };
}

export default function AlertaTutus() {
    // fila: se um alerta abrir outro, eles aparecem um depois do outro
    const [fila, setFila] = useState([]);

    useEffect(() => {
        mostrarNaTela = (alerta) => setFila((atual) => [...atual, alerta]);

        return () => {
            mostrarNaTela = null;
        };
    }, []);

    const alerta = fila[0];

    if (!alerta) return null;

    const icone = escolherIcone(alerta);
    const emColuna = alerta.botoes.length > 2;

    function tocar(botao) {
        setFila((atual) => atual.slice(1));
        botao?.onPress?.();
    }

    // botão "voltar" do Android: age como o botão de cancelar
    function voltar() {
        tocar(alerta.botoes.find((botao) => botao.style === "cancel"));
    }

    return (
        <Modal
            transparent
            visible
            animationType="fade"
            statusBarTranslucent
            onRequestClose={voltar}
        >
            <View style={estilos.fundo}>
                <View style={estilos.cartao}>

                    <View style={[estilos.bola, { backgroundColor: icone.fundo }]}>
                        <Ionicons name={icone.nome} size={26} color={icone.cor} />
                    </View>

                    <Text style={estilos.titulo}>{alerta.titulo}</Text>

                    {!!alerta.mensagem && (
                        <Text style={estilos.mensagem}>{alerta.mensagem}</Text>
                    )}

                    <View style={[estilos.botoes, emColuna && estilos.botoesColuna]}>
                        {alerta.botoes.map((botao, indice) => (
                            <Botao
                                key={`${botao.text}-${indice}`}
                                titulo={botao.text}
                                variante={botao.style === "cancel" ? "contorno" : "primario"}
                                onPress={() => tocar(botao)}
                                style={[
                                    estilos.botao,
                                    emColuna ? estilos.botaoColuna : estilos.botaoLinha,
                                    botao.style === "destructive" && estilos.botaoPerigo,
                                ]}
                            />
                        ))}
                    </View>

                </View>
            </View>
        </Modal>
    );
}

const estilos = StyleSheet.create({
    fundo: {
        flex: 1,
        backgroundColor: "rgba(30, 23, 15, 0.55)",
        alignItems: "center",
        justifyContent: "center",
        padding: 28,
    },

    cartao: {
        width: "100%",
        maxWidth: 360,
        backgroundColor: cores.branco,
        borderRadius: 28,
        paddingHorizontal: 22,
        paddingTop: 26,
        paddingBottom: 22,
        alignItems: "center",
        ...sombra,
    },

    bola: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
    },

    titulo: {
        fontFamily: fontes.negrito,
        fontSize: 22,
        lineHeight: 30,
        color: cores.marrom,
        textAlign: "center",
    },

    mensagem: {
        fontFamily: fontes.regular,
        fontSize: 16,
        lineHeight: 22,
        color: cores.marromClaro,
        textAlign: "center",
        marginTop: 6,
    },

    botoes: {
        flexDirection: "row",
        gap: 10,
        marginTop: 22,
        alignSelf: "stretch",
    },

    botoesColuna: {
        flexDirection: "column",
    },

    botao: {
        minWidth: 0,
        marginTop: 0,
        paddingHorizontal: 12,
    },

    botaoLinha: {
        flex: 1,
    },

    botaoColuna: {
        alignSelf: "stretch",
    },

    botaoPerigo: {
        backgroundColor: cores.erro,
        borderWidth: 0,
    },
});