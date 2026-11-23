
import React, { useState, useCallback } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useSQLiteContext } from "expo-sqlite";
import { verificarAvisosCuidados } from "../utils/avisosCuidados";
import { verificarAvisosAlimentacao } from "../utils/avisosAlimentacao";

import {
    listarNotificacoes,
    marcarNotificacaoLida,
    marcarTodasLidas
} from "../utils/notificacoesStorage";

import { verificarAvisosVacinas } from "../utils/avisosVacinas";

const COR = {
    fundo: "#FFFDF8",
    branco: "#FFFFFF",
    marrom: "#332716",
    laranja: "#FA9F2A",
    oliva: "#75571F",
    creme: "#FFEAC8",
};

function iconeNotificacao(tipo) {
    switch (tipo) {
        case "curtida":
            return "heart";
        case "comentario":
            return "chatbubble";
        case "alimentacao":
            return "restaurant";
        case "vacina":
            return "medical";
        case "consulta":
            return "calendar";
        case "medicamento":
            return "medkit";
        default:
            return "notifications";
    }
}

export default function Notificacoes({ onAtualizarContador }) {
    const insets = useSafeAreaInsets();
    const db = useSQLiteContext();

    const [notificacoes, setNotificacoes] = useState([]);
    const [carregando, setCarregando] = useState(true);

    const carregarNotificacoes = useCallback(async () => {
        try {
            await verificarAvisosVacinas(db);
            await verificarAvisosCuidados(db);
            await verificarAvisosAlimentacao(db);

            const lista = await listarNotificacoes();
            setNotificacoes(lista);
            await onAtualizarContador?.();

        } catch (erro) {
            console.error("Erro ao carregar notificações:", erro);
        } finally {
            setCarregando(false);
        }
    }, [db, onAtualizarContador]);

    useFocusEffect(
        useCallback(() => {
            setCarregando(true);
            carregarNotificacoes();
        }, [carregarNotificacoes])
    );

    async function marcarLida(id) {
        try {
            await marcarNotificacaoLida(id);
            await carregarNotificacoes();
        } catch (erro) {
            console.error("Erro ao marcar notificação:", erro);
        }
    }

    async function marcarTudoLido() {
        try {
            await marcarTodasLidas();
            await carregarNotificacoes();
        } catch (erro) {
            console.error("Erro ao marcar todas:", erro);
        }
    }

    const naoLidas = notificacoes.filter(item => !item.lida).length;

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={[
                    styles.conteudo,
                    { paddingTop: insets.top + 20 }
                ]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.cabecalho}>
                    <Text style={styles.titulo}>Notificações</Text>

                    {naoLidas > 0 && (
                        <View style={styles.contador}>
                            <Text style={styles.textoContador}>
                                {naoLidas}
                            </Text>
                        </View>
                    )}
                </View>

                {naoLidas > 0 && (
                    <Pressable
                        style={styles.botaoMarcar}
                        onPress={marcarTudoLido}
                    >
                        <Ionicons
                            name="checkmark-done-outline"
                            size={19}
                            color={COR.laranja}
                        />

                        <Text style={styles.textoMarcar}>
                            Marcar todas como lidas
                        </Text>
                    </Pressable>
                )}

                {carregando ? (
                    <View style={styles.caixaVazia}>
                        <ActivityIndicator
                            size="large"
                            color={COR.laranja}
                        />
                    </View>
                ) : notificacoes.length === 0 ? (
                    <View style={styles.caixaVazia}>
                        <View style={styles.circulo}>
                            <Ionicons
                                name="notifications-outline"
                                size={42}
                                color={COR.marrom}
                            />
                        </View>

                        <Text style={styles.tituloVazio}>
                            Tudo em dia!
                        </Text>

                        <Text style={styles.descricaoVazia}>
                            Seus avisos, curtidas, comentários e lembretes aparecerão aqui.
                        </Text>
                    </View>
                ) : (
                    <View style={styles.lista}>
                        {notificacoes.map(item => (
                            <Pressable
                                key={String(item.id)}
                                style={[
                                    styles.cartao,
                                    !item.lida && styles.cartaoNovo
                                ]}
                                onPress={() => marcarLida(item.id)}
                            >
                                <View style={styles.iconeContainer}>
                                    <Ionicons
                                        name={iconeNotificacao(item.tipo)}
                                        size={23}
                                        color={COR.marrom}
                                    />
                                </View>

                                <View style={styles.informacoes}>
                                    <Text style={styles.tituloCartao}>
                                        {item.titulo}
                                    </Text>

                                    <Text style={styles.mensagem}>
                                        {item.mensagem}
                                    </Text>

                                    <Text style={styles.data}>
                                        {item.data
                                            ? new Date(item.data).toLocaleString("pt-BR")
                                            : ""}
                                    </Text>
                                </View>

                                {!item.lida && (
                                    <View style={styles.pontoNovo} />
                                )}
                            </Pressable>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COR.fundo,
    },

    conteudo: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingBottom: 30,
    },

    cabecalho: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 20,
    },

    titulo: {
        fontFamily: "Ruwudu-Bold",
        fontSize: 32,
        color: COR.marrom,
    },

    contador: {
        backgroundColor: COR.laranja,
        borderRadius: 20,
        minWidth: 28,
        height: 28,
        paddingHorizontal: 6,
        alignItems: "center",
        justifyContent: "center",
    },

    textoContador: {
        fontFamily: "Ruwudu-Bold",
        fontSize: 15,
        color: COR.marrom,
    },

    botaoMarcar: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-end",
        gap: 6,
        marginBottom: 18,
    },

    textoMarcar: {
        fontFamily: "Ruwudu-Bold",
        fontSize: 15,
        color: COR.laranja,
    },

    caixaVazia: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 20,
        paddingBottom: 80,
        minHeight: 350,
    },

    circulo: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COR.creme,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
    },

    tituloVazio: {
        fontFamily: "Ruwudu-Bold",
        fontSize: 24,
        color: COR.marrom,
        marginBottom: 10,
    },

    descricaoVazia: {
        fontFamily: "Ruwudu-Regular",
        fontSize: 16,
        lineHeight: 24,
        color: COR.oliva,
        textAlign: "center",
    },

    lista: {
        gap: 12,
    },

    cartao: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COR.branco,
        borderRadius: 22,
        padding: 15,
        gap: 12,
        elevation: 2,
    },

    cartaoNovo: {
        backgroundColor: COR.creme,
        borderWidth: 1,
        borderColor: COR.laranja,
    },

    iconeContainer: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: COR.laranja,
        alignItems: "center",
        justifyContent: "center",
    },

    informacoes: {
        flex: 1,
    },

    tituloCartao: {
        fontFamily: "Ruwudu-Bold",
        fontSize: 17,
        color: COR.marrom,
    },

    mensagem: {
        fontFamily: "Ruwudu-Regular",
        fontSize: 15,
        color: COR.oliva,
        marginTop: 4,
    },

    data: {
        fontFamily: "Ruwudu-Regular",
        fontSize: 12,
        color: COR.oliva,
        marginTop: 8,
    },

    pontoNovo: {
        width: 9,
        height: 9,
        borderRadius: 5,
        backgroundColor: COR.laranja,
    },
});
