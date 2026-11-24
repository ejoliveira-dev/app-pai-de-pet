import React, { useState, useCallback } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { listarCuidados } from "../database/Database";
import { cores, fontes, sombra } from "../styles/tema";

// Dias da semana na ordem em que aparecem no calendário.
const DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

// Cores de fundo para cada status do cuidado.
const CORES_STATUS = {
    agendado: "#FA9F2A",
    realizado: "#E6DCCE",
    atrasado: "#F8D7D7",
};

// Define um ícone para cada tipo de higiene.
function obterIcone(nome) {
    const cuidado = nome.toLowerCase();

    if (cuidado.includes("banho")) return "shower-head";
    if (cuidado.includes("tosa")) return "content-cut";
    if (cuidado.includes("unha")) return "hand-back-right-outline";
    if (cuidado.includes("escovação")) return "brush";
    if (cuidado.includes("limpeza")) return "broom";

    return "paw";
}

function converterData(texto) {
    const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto || "");

    if (!partes) return null;

    const [, dia, mes, ano] = partes.map(Number);
    const data = new Date(ano, mes - 1, dia);

    if (
        data.getDate() !== dia ||
        data.getMonth() !== mes - 1 ||
        data.getFullYear() !== ano
    ) {
        return null;
    }

    return data;
}

function dataCurta(data) {
    return `${String(data.getDate()).padStart(2, "0")}/${String(data.getMonth() + 1).padStart(2, "0")}`;
}

function inicioSemana(data, deslocamento) {
    const inicio = new Date(data);
    inicio.setHours(0, 0, 0, 0);

    const diaSemana = (inicio.getDay() + 6) % 7;

    inicio.setDate(inicio.getDate() - diaSemana + deslocamento * 7);

    return inicio;
}

// Verifica se o cuidado está realizado, atrasado ou agendado.
function obterStatus(item, hoje) {
    if (item.concluido) return "realizado";

    const data = converterData(item.data);

    if (data && data < hoje) return "atrasado";

    return "agendado";
}

export default function CalendarioHigiene({ pet, onAbrirCuidados, agora }) {
    const db = useSQLiteContext();

    const [registros, setRegistros] = useState([]);
    const [semana, setSemana] = useState(0);
    const [selecionado, setSelecionado] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(false);

    const hoje = new Date(agora ?? Date.now());
    hoje.setHours(0, 0, 0, 0);

    useFocusEffect(
        useCallback(() => {
            let ativo = true;

            async function carregar() {
                setCarregando(true);
                setErro(false);

                try {
                    const lista = await listarCuidados(db, pet.id_pet, "higiene");

                    if (ativo) setRegistros(lista);

                } catch (erro) {
                    console.error("Erro ao carregar calendário:", erro);

                    if (ativo) {
                        setRegistros([]);
                        setErro(true);
                    }

                } finally {
                    if (ativo) setCarregando(false);
                }
            }

            carregar();

            return () => {
                ativo = false;
            };

        }, [db, pet.id_pet])
    );

    const inicio = inicioSemana(hoje, semana);

    const dias = Array.from({ length: 7 }, (_, indice) => {
        const data = new Date(inicio);

        data.setDate(inicio.getDate() + indice);

        return {
            data,
            nome: DIAS[indice],
            numero: data.getDate(),

            cuidados: registros.filter(item => {
                const dataCuidado = converterData(item.data);

                return dataCuidado && dataCuidado.getTime() === data.getTime();
            }),
        };
    });

    const indiceSelecionado = selecionado ?? (semana === 0 ? (hoje.getDay() + 6) % 7 : 0);
    const diaSelecionado = dias[indiceSelecionado];

    const proximoCuidado = registros
        .filter(item => {
            const data = converterData(item.data);

            return !item.concluido && data && data >= hoje;
        })
        .sort((a, b) => converterData(a.data) - converterData(b.data))[0];


    function mudarSemana(valor) {
        setSemana(atual => atual + valor);
        setSelecionado(null);
    }

    return (
        <>
            <View style={styles.card}>

                <View style={styles.cabecalho}>

                    <View style={styles.bolaTitulo}>
                        <MaterialCommunityIcons
                            name="shower-head"
                            size={25}
                            color={cores.marrom}
                        />
                    </View>

                    <View style={styles.cabecalhoTextos}>
                        <Text style={styles.titulo}>
                            Cuidados de {pet.nome}
                        </Text>

                        <Text style={styles.subtitulo}>
                            {semana === 0
                                ? "Esta semana"
                                : semana === 1
                                    ? "Próxima semana"
                                    : semana === -1
                                        ? "Semana passada"
                                        : "Calendário semanal"}
                        </Text>
                    </View>

                </View>

                <View style={styles.navegacao}>

                    <Pressable
                        onPress={() => mudarSemana(-1)}
                        style={styles.seta}
                        accessibilityLabel="Semana anterior"
                        accessibilityRole="button"
                    >
                        <Ionicons name="chevron-back" size={20} color={cores.marrom} />
                    </Pressable>

                    <Text style={styles.periodo}>
                        {dataCurta(dias[0].data)} a {dataCurta(dias[6].data)} de {dias[6].data.getFullYear()}
                    </Text>

                    <Pressable
                        onPress={() => mudarSemana(1)}
                        style={styles.seta}
                        accessibilityLabel="Próxima semana"
                        accessibilityRole="button"
                    >
                        <Ionicons name="chevron-forward" size={20} color={cores.marrom} />
                    </Pressable>

                </View>

                {/* Calendário dividido em sete colunas. */}
                <View style={styles.calendario}>

                    {dias.map((dia, indice) => {

                        const ativo = indiceSelecionado === indice;
                        const ehHoje = dia.data.getTime() === hoje.getTime();

                        return (
                            <Pressable
                                key={indice}
                                onPress={() => setSelecionado(indice)}
                                accessibilityRole="button"
                                accessibilityState={{ selected: ativo }}
                                accessibilityLabel={`${dia.nome}, ${dataCurta(dia.data)}, ${dia.cuidados.length} cuidados`}
                                style={[
                                    styles.coluna,
                                    ativo && styles.colunaAtiva
                                ]}
                            >

                                <Text style={styles.diaSemana}>
                                    {dia.nome}
                                </Text>

                                <View style={[
                                    styles.numeroDia,
                                    ehHoje && styles.numeroHoje
                                ]}>

                                    <Text style={[
                                        styles.textoDia,
                                        ehHoje && styles.textoHoje
                                    ]}>
                                        {dia.numero}
                                    </Text>

                                </View>

                                <View style={styles.iconesDia}>

                                    {dia.cuidados.slice(0, 3).map(item => {

                                        const status = obterStatus(item, hoje);

                                        return (
                                            <View
                                                key={item.id}
                                                style={[
                                                    styles.iconeCuidado,
                                                    { backgroundColor: CORES_STATUS[status] }
                                                ]}
                                            >

                                                <MaterialCommunityIcons
                                                    name={obterIcone(item.nome)}
                                                    size={18}
                                                    color={status === "atrasado"
                                                        ? "#A52C2C"
                                                        : cores.marrom}
                                                />

                                            </View>
                                        );
                                    })}

                                    {/* Indica se existem mais cuidados no mesmo dia. */}
                                    {dia.cuidados.length > 3 && (
                                        <Text style={styles.maisCuidados}>
                                            +{dia.cuidados.length - 3}
                                        </Text>
                                    )}

                                    {dia.cuidados.length === 0 && (
                                        <Text style={styles.semCuidado}>–</Text>
                                    )}

                                </View>

                            </Pressable>
                        );
                    })}

                </View>

                {/* Legenda das cores do calendário. */}
                <View style={styles.legenda}>

                    {[
                        ["Agendado", "agendado"],
                        ["Realizado", "realizado"],
                        ["Atrasado", "atrasado"]
                    ].map(([texto, status]) => (

                        <View key={status} style={styles.legendaItem}>

                            <View style={[
                                styles.ponto,
                                { backgroundColor: CORES_STATUS[status] }
                            ]} />

                            <Text style={styles.legendaTexto}>
                                {texto}
                            </Text>

                        </View>
                    ))}

                </View>

                <View style={styles.divisor} />

                {/* Detalhes do dia selecionado. */}
                <Text style={styles.tituloDetalhes}>
                    Cuidados de {dataCurta(diaSelecionado.data)}
                </Text>

                {carregando ? (

                    <Text style={styles.vazio}>
                        Carregando cuidados...
                    </Text>

                ) : erro ? (

                    <Text style={styles.vazio}>
                        Não foi possível carregar os cuidados.
                    </Text>

                ) : diaSelecionado.cuidados.length === 0 ? (

                    <Text style={styles.vazio}>
                        Nenhum cuidado neste dia.
                    </Text>

                ) : (

                    diaSelecionado.cuidados.map(item => {

                        const status = obterStatus(item, hoje);

                        return (
                            <View key={item.id} style={styles.detalhe}>

                                <View style={[
                                    styles.bolaDetalhe,
                                    { backgroundColor: CORES_STATUS[status] }
                                ]}>

                                    <MaterialCommunityIcons
                                        name={obterIcone(item.nome)}
                                        size={21}
                                        color={cores.marrom}
                                    />

                                </View>

                                <View style={styles.detalheTextos}>

                                    <Text style={styles.detalheNome}>
                                        {item.nome}
                                    </Text>

                                    <Text style={[
                                        styles.detalheStatus,
                                        status === "atrasado" && { color: cores.erro }
                                    ]}>
                                        {status === "realizado"
                                            ? "Realizado"
                                            : status === "atrasado"
                                                ? "Atrasado"
                                                : "Agendado"}
                                    </Text>

                                    {!!item.detalhes && (
                                        <Text style={styles.detalheStatus}>
                                            {item.detalhes}
                                        </Text>
                                    )}

                                </View>

                                <Ionicons
                                    name={item.concluido
                                        ? "checkmark-circle-outline"
                                        : "time-outline"}
                                    size={21}
                                    color={cores.marromClaro}
                                />

                            </View>
                        );
                    })
                )}

                {!carregando && !erro && proximoCuidado && (
                    <View style={styles.proximo}>

                        <MaterialCommunityIcons
                            name={obterIcone(proximoCuidado.nome)}
                            size={24}
                            color={cores.marrom}
                        />

                        <View style={styles.detalheTextos}>

                            <Text style={styles.proximoRotulo}>
                                Próximo cuidado
                            </Text>

                            <Text style={styles.proximoTexto}>
                                {proximoCuidado.nome} • {proximoCuidado.data}
                            </Text>

                        </View>

                    </View>
                )}

                {/* Atalho para a tela Meu Pet. */}
                <Pressable
                    onPress={onAbrirCuidados}
                    style={styles.botao}
                    accessibilityRole="button"
                >

                    <Ionicons name="add" size={21} color={cores.laranjaClaro} />

                    <Text style={styles.botaoTexto}>
                        Registrar cuidado
                    </Text>

                </Pressable>

            </View>
        </>
    );
}

const styles = StyleSheet.create({

    tituloSecao: {
        fontFamily: fontes.negrito,
        fontSize: 25,
        lineHeight: 32,
        color: cores.marrom,
        marginTop: 24,
        marginBottom: 12,
    },

    card: {
        backgroundColor: cores.branco,
        borderRadius: 28,
        padding: 14,
        marginBottom: 12,
        ...sombra,
    },

    cabecalho: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginBottom: 12,
    },

    bolaTitulo: {
        width: 46,
        height: 46,
        borderRadius: 18,
        backgroundColor: cores.laranjaClaro,
        alignItems: "center",
        justifyContent: "center",
    },

    cabecalhoTextos: {
        flex: 1,
        minWidth: 0,
    },

    titulo: {
        fontFamily: fontes.negrito,
        fontSize: 21,
        lineHeight: 26,
        color: cores.marrom,
    },

    subtitulo: {
        fontFamily: fontes.regular,
        fontSize: 15,
        color: cores.marromClaro,
    },

    navegacao: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
    },

    seta: {
        width: 32,
        height: 36,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFF1DC",
    },

    periodo: {
        fontFamily: fontes.negrito,
        fontSize: 14,
        color: cores.marrom,
        flex: 1,
        textAlign: "center",
    },

    calendario: {
        flexDirection: "row",
        gap: 3,
    },

    coluna: {
        flex: 1,
        minWidth: 0,
        minHeight: 128,
        borderRadius: 15,
        backgroundColor: cores.fundo,
        borderWidth: 1,
        borderColor: "#F2DFC4",
        alignItems: "center",
        paddingVertical: 7,
    },

    colunaAtiva: {
        backgroundColor: "#FFF1DC",
        borderColor: cores.laranja,
    },

    diaSemana: {
        fontFamily: fontes.regular,
        fontSize: 12,
        color: cores.marromClaro,
        textAlign: "center",
    },

    numeroDia: {
        width: 25,
        height: 25,
        borderRadius: 13,
        alignItems: "center",
        justifyContent: "center",
        marginVertical: 4,
    },

    numeroHoje: {
        backgroundColor: "transparent",
    },

    textoDia: {
        fontFamily: fontes.negrito,
        fontSize: 18,
        color: cores.marrom,
    },

    textoHoje: {
        color: cores.marrom,
        textDecorationLine: "underline",
        textDecorationColor: cores.laranja,
    },

    iconesDia: {
        alignItems: "center",
        width: "100%",
        gap: 4,
    },

    iconeCuidado: {
        width: 28,
        maxWidth: "90%",
        height: 28,
        borderRadius: 9,
        alignItems: "center",
        justifyContent: "center",
    },

    semCuidado: {
        fontSize: 18,
        color: "#B9AA96",
        marginTop: 5,
    },

    maisCuidados: {
        fontFamily: fontes.negrito,
        fontSize: 12,
        color: cores.marromClaro,
    },

    legenda: {
        flexDirection: "row",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: 10,
        marginTop: 14,
        marginBottom: 12,
    },

    legendaItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },

    ponto: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },

    legendaTexto: {
        fontFamily: fontes.regular,
        fontSize: 12,
        color: cores.marromClaro,
    },

    divisor: {
        height: 1,
        backgroundColor: "#F2DFC4",
        marginBottom: 12,
    },

    tituloDetalhes: {
        fontFamily: fontes.negrito,
        fontSize: 16,
        color: cores.marrom,
        marginBottom: 8,
    },

    vazio: {
        fontFamily: fontes.regular,
        fontSize: 15,
        color: cores.marromClaro,
        textAlign: "center",
        paddingVertical: 10,
    },

    detalhe: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginBottom: 8,
        paddingVertical: 5,
    },

    bolaDetalhe: {
        width: 38,
        height: 38,
        borderRadius: 13,
        alignItems: "center",
        justifyContent: "center",
    },

    detalheTextos: {
        flex: 1,
        minWidth: 0,
    },

    detalheNome: {
        fontFamily: fontes.negrito,
        fontSize: 17,
        color: cores.marrom,
    },

    detalheStatus: {
        fontFamily: fontes.regular,
        fontSize: 13,
        color: cores.marromClaro,
    },

    proximo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        padding: 12,
        borderRadius: 17,
        backgroundColor: cores.laranjaClaro,
        marginTop: 8,
    },

    proximoRotulo: {
        fontFamily: fontes.regular,
        fontSize: 13,
        color: cores.marromClaro,
    },

    proximoTexto: {
        fontFamily: fontes.negrito,
        fontSize: 16,
        color: cores.marrom,
    },

    botao: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        minHeight: 44,
        borderRadius: 24,
        backgroundColor: cores.marrom,
        marginTop: 14,
    },

    botaoTexto: {
        fontFamily: fontes.negrito,
        fontSize: 17,
        color: cores.laranjaClaro,
    },

});