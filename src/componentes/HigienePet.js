import React, { useState, useCallback, useEffect } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Switch } from "react-native";
import { Alert } from "./AlertaTutus";
import { useSQLiteContext } from "expo-sqlite";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { cores, fontes, sombra } from "../styles/tema";

import { listarCuidados, inserirCuidado, atualizarCuidado, removerCuidado, alterarStatusCuidado, obterIntervaloHigiene, salvarIntervaloHigiene } from "../database/Database";

// Define as opções de higiene disponíveis para cada espécie.
const HIGIENE_POR_ESPECIE = {
    "Cachorro": ["Banho", "Tosa", "Corte de unhas", "Escovação"],
    "Gato": ["Corte de unhas", "Escovação"],
    "Coelho": ["Escovação", "Corte de unhas"],
    "Hamster": ["Limpeza do habitat"],
    "Porquinho-da-índia": ["Escovação", "Corte de unhas", "Limpeza do habitat"],
    "Tartaruga": ["Limpeza do habitat"],
    "Peixe": ["Limpeza do aquário"],
    "Calopsita": ["Limpeza da gaiola"],
    "Periquito": ["Limpeza da gaiola"],
    "Canário": ["Limpeza da gaiola"],
    "Papagaio": ["Limpeza da gaiola"],
    "Furão": ["Escovação", "Corte de unhas", "Limpeza do habitat"],
    "Outro tipo de pássaro": ["Limpeza do habitat"],
};

// Formata a data no padrão DD/MM/AAAA.
function formatarData(texto) {
    const n = texto.replace(/\D/g, "").slice(0, 8);

    if (n.length > 4) {
        return `${n.slice(0, 2)}/${n.slice(2, 4)}/${n.slice(4)}`;
    }

    if (n.length > 2) {
        return `${n.slice(0, 2)}/${n.slice(2)}`;
    }

    return n;
}

// Converte uma string no formato DD/MM/AAAA em um objeto Date.
function converterData(texto) {
    const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto.trim());

    if (!partes) return null;

    const [, dia, mes, ano] = partes.map(Number);
    const data = new Date(ano, mes - 1, dia);

    if (
        ano < 1900 ||
        ano > 2100 ||
        data.getDate() !== dia ||
        data.getMonth() !== mes - 1 ||
        data.getFullYear() !== ano
    ) {
        return null;
    }

    return data;
}

// Transforma uma data no formato DD/MM/AAAA.
function dataBrasileira(data) {
    const dia = String(data.getDate()).padStart(2, "0");
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const ano = data.getFullYear();

    return `${dia}/${mes}/${ano}`;
}

// Calcula a próxima data de acordo com o intervalo escolhido.
function calcularProximaData(dias, dataBase = new Date()) {
    const proxima = new Date(dataBase);

    proxima.setDate(proxima.getDate() + dias);

    return dataBrasileira(proxima);
}

// Gera um identificador único para cada registro.
function gerarId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// Verifica se o intervalo informado é válido.
function intervaloValido(dias) {
    return Number.isInteger(dias) && dias >= 1 && dias <= 365;
}

export default function HigienePet({ pet }) {
    const db = useSQLiteContext();

    const opcoes = [...(HIGIENE_POR_ESPECIE[pet.especie] || []), "Outro cuidado"];

    const [registros, setRegistros] = useState([]);
    const [nome, setNome] = useState("");
    const [outroCuidado, setOutroCuidado] = useState("");
    const [data, setData] = useState("");
    const [detalhes, setDetalhes] = useState("");
    const [editando, setEditando] = useState(null);

    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);

    const [repetir, setRepetir] = useState(false);
    const [intervalo, setIntervalo] = useState("");
    const [carregandoIntervalo, setCarregandoIntervalo] = useState(false);

    const [realizado, setRealizado] = useState(false);

    const nomeFinal = nome === "Outro cuidado" ? outroCuidado.trim() : nome;

    useFocusEffect(
        useCallback(() => {
            let ativo = true;

            async function carregar() {
                setCarregando(true);

                try {
                    const lista = await listarCuidados(db, pet.id_pet, "higiene");

                    if (ativo) setRegistros(lista);

                } catch (erro) {
                    console.error("Erro ao carregar higiene:", erro);

                    if (ativo) {
                        Alert.alert("Erro", "Não foi possível carregar os registros.");
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

    useEffect(() => {
        let ativo = true;

        async function carregarIntervalo() {
            setRepetir(false);
            setIntervalo("");

            if (!nomeFinal) {
                setCarregandoIntervalo(false);
                return;
            }

            setCarregandoIntervalo(true);

            try {
                const valor = await obterIntervaloHigiene(db, pet.id_pet, nomeFinal);
                const dias = Number(valor);

                if (ativo && intervaloValido(dias)) {
                    setRepetir(true);
                    setIntervalo(String(dias));
                }

            } catch (erro) {
                console.error("Erro ao carregar intervalo:", erro);

            } finally {
                if (ativo) setCarregandoIntervalo(false);
            }
        }

        carregarIntervalo();

        return () => {
            ativo = false;
        };
    }, [db, pet.id_pet, nomeFinal, editando]);

    function selecionarCuidado(opcao) {
        setNome(opcao);
        setOutroCuidado("");
    }

    function limparFormulario() {
        setNome("");
        setOutroCuidado("");
        setData("");
        setDetalhes("");
        setEditando(null);
        setRepetir(false);
        setIntervalo("");
        setRealizado(false);
    }

    async function atualizarLista() {
        const lista = await listarCuidados(db, pet.id_pet, "higiene");
        setRegistros(lista);
    }
    // Cria automaticamente o próximo cuidado de acordo com a frequência.
    async function agendarProximo(registro, dias, dataBase) {
        if (!intervaloValido(dias)) return;

        const lista = await listarCuidados(db, pet.id_pet, "higiene");

   // Evita agendar o mesmo cuidado mais de uma vez.
        const jaAgendado = lista.some(item =>
            item.id !== registro.id &&
            item.nome === registro.nome &&
            !item.concluido
        );

        if (jaAgendado) return;

        const proximo = {
            id: gerarId(),
            nome: registro.nome,
            data: calcularProximaData(dias, dataBase),
            detalhes: registro.detalhes || "",
            concluido: false,
        };

        await inserirCuidado(db, pet.id_pet, "higiene", proximo);
    }

    async function salvar() {
        if (salvando || carregando || carregandoIntervalo) return;

        if (!nomeFinal) {
            Alert.alert("Atenção", "Informe o cuidado de higiene.");
            return;
        }

        const dataInformada = converterData(data);

        if (!dataInformada) {
            Alert.alert("Data inválida", "Informe uma data válida no formato DD/MM/AAAA.");
            return;
        }

       // Evita marcar um cuidado futuro como realizado.
        if (realizado && dataInformada > new Date()) {
            Alert.alert("Atenção", "Um cuidado futuro ainda não pode ser marcado como realizado.");
            return;
        }

        const dias = Number(intervalo);

        if (repetir && !intervaloValido(dias)) {
            Alert.alert("Intervalo inválido", "Informe um intervalo entre 1 e 365 dias.");
            return;
        }

        const anterior = registros.find(item => item.id === editando);

        const registro = {
            id: editando || gerarId(),
            nome: nomeFinal,
            data: data.trim(),
            detalhes: detalhes.trim(),
            concluido: realizado,
        };

        setSalvando(true);

        try {

            await db.withTransactionAsync(async () => {

                if (editando) {
                    await atualizarCuidado(db, registro);
                } else {
                    await inserirCuidado(db, pet.id_pet, "higiene", registro);
                }

                await salvarIntervaloHigiene(db, pet.id_pet, nomeFinal, repetir ? dias : null);

                if (realizado && repetir && !anterior?.concluido) {
                    await agendarProximo(registro, dias, dataInformada);
                }
            });

            await atualizarLista();
            limparFormulario();

            Alert.alert("Sucesso", "Registro de higiene salvo!");

        } catch (erro) {
            console.error("Erro ao salvar higiene:", erro);
            Alert.alert("Erro", "Não foi possível salvar o registro.");

        } finally {
            setSalvando(false);
        }
    }

    function editar(item) {
        setEditando(item.id);

        if (opcoes.includes(item.nome) && item.nome !== "Outro cuidado") {
            setNome(item.nome);
            setOutroCuidado("");
        } else {
            setNome("Outro cuidado");
            setOutroCuidado(item.nome);
        }

        setData(item.data);
        setDetalhes(item.detalhes || "");
        setRealizado(item.concluido);
    }

    function excluir(id) {
        Alert.alert("Excluir registro?", "Deseja excluir este cuidado?", [
            {
                text: "Cancelar",
                style: "cancel"
            },
            {
                text: "Excluir",
                style: "destructive",

                onPress: async () => {
                    if (salvando) return;

                    setSalvando(true);

                    try {
                        await removerCuidado(db, id);

                        await atualizarLista();

                        if (editando === id) {
                            limparFormulario();
                        }

                    } catch (erro) {
                        console.error("Erro ao excluir higiene:", erro);
                        Alert.alert("Erro", "Não foi possível excluir o registro.");

                    } finally {
                        setSalvando(false);
                    }
                }
            }
        ]);
    }
// Altera o status de um cuidado entre concluído e pendente.
    async function alterarStatus(item) {
        if (salvando) return;

        setSalvando(true);

        try {
            await db.withTransactionAsync(async () => {

                if (item.concluido) {

                    await alterarStatusCuidado(db, item.id, false);

                } else {

                    const hoje = new Date();

                    const registroAtualizado = {
                        ...item,
                        data: dataBrasileira(hoje),
                        concluido: true,
                    };

                    await atualizarCuidado(db, registroAtualizado);

                    const valor = await obterIntervaloHigiene(db, pet.id_pet, item.nome);
                    const dias = Number(valor);

                    if (intervaloValido(dias)) {
                        await agendarProximo(registroAtualizado, dias, hoje);
                    }
                }
            });

            await atualizarLista();

            if (editando === item.id) {
                limparFormulario();
            }

        } catch (erro) {
            console.error("Erro ao alterar status:", erro);
            Alert.alert("Erro", "Não foi possível alterar o status.");

        } finally {
            setSalvando(false);
        }
    }

    if (carregando) {
        return (
            <Text style={styles.vazio}>
                Carregando registros de higiene...
            </Text>
        );
    }

    return (
        <>

            <View style={styles.card}>

                <Text style={styles.label}>Selecione o cuidado</Text>

                {/* Opções disponíveis conforme a espécie do pet. */}
                <View style={styles.opcoes}>
                    {opcoes.map(opcao => (
                        <Pressable
                            key={opcao}
                            onPress={() => selecionarCuidado(opcao)}
                            disabled={salvando}
                            style={[
                                styles.opcao,
                                nome === opcao && styles.opcaoSelecionada
                            ]}
                        >
                            <Text style={styles.textoOpcao}>
                                {opcao}
                            </Text>
                        </Pressable>
                    ))}
                </View>

                {/* Campo para cadastrar um cuidado personalizado. */}
                {nome === "Outro cuidado" && (
                    <TextInput
                        style={styles.campo}
                        placeholder="Qual cuidado?"
                        placeholderTextColor="#A89A82"
                        value={outroCuidado}
                        onChangeText={setOutroCuidado}
                        editable={!salvando}
                    />
                )}

                {/* Campo para inserir a data do cuidado. */}
                <TextInput
                    style={styles.campo}
                    placeholder="Data: DD/MM/AAAA"
                    placeholderTextColor="#A89A82"
                    value={data}
                    onChangeText={texto => setData(formatarData(texto))}
                    keyboardType="numeric"
                    maxLength={10}
                    editable={!salvando}
                />

                {/* Informações adicionais sobre o cuidado. */}
                <TextInput
                    style={[styles.campo, styles.campoGrande]}
                    placeholder="Observações (opcional)"
                    placeholderTextColor="#A89A82"
                    value={detalhes}
                    onChangeText={setDetalhes}
                    multiline
                    editable={!salvando}
                />

                {/* indicar se o cuidado já foi realizado. */}
                <View style={styles.linhaRealizado}>

                    <Text style={styles.textoOpcao}>
                        Cuidado já realizado
                    </Text>

                    <Switch
                        value={realizado}
                        onValueChange={setRealizado}
                        disabled={salvando}
                        trackColor={{ false: "#D8D0C4", true: "#FFEAC8" }}
                        thumbColor={realizado ? cores.laranja : "#FFFFFF"}
                    />

                </View>

                {nomeFinal !== "" && (
                    <View style={styles.repeticao}>

                        <View style={styles.linhaRepeticao}>

                            <Text style={styles.textoOpcao}>
                                Repetir cuidado
                            </Text>

                            <Switch
                                value={repetir}
                                onValueChange={setRepetir}
                                disabled={salvando || carregandoIntervalo}
                                trackColor={{ false: "#D8D0C4", true: "#FFEAC8" }}
                                thumbColor={repetir ? cores.laranja : "#FFFFFF"}
                            />

                        </View>

                        {repetir && (
                            <>
                                <View style={styles.linhaIntervalo}>

                                    <Text style={styles.textoOpcao}>
                                        A cada
                                    </Text>

                                    <TextInput
                                        style={[styles.campo, styles.campoIntervalo]}
                                        placeholder="0"
                                        value={intervalo}
                                        onChangeText={texto => setIntervalo(texto.replace(/\D/g, ""))}
                                        keyboardType="numeric"
                                        maxLength={3}
                                        editable={!salvando}
                                    />

                                    <Text style={styles.textoOpcao}>
                                        dias
                                    </Text>

                                </View>

                                <Text style={styles.textoAjuda}>
                                    Ao concluir este cuidado, o próximo será agendado automaticamente.
                                </Text>

                                {realizado &&
                                    converterData(data) &&
                                    intervaloValido(Number(intervalo)) && (
                                        <Text style={styles.proximaData}>
                                            Próximo cuidado: {calcularProximaData(Number(intervalo), converterData(data))}
                                        </Text>
                                    )}
                            </>
                        )}

                    </View>
                )}

                <Pressable
                    style={[
                        styles.botao,
                        (salvando || carregandoIntervalo) && styles.pressionado
                    ]}
                    onPress={salvar}
                    disabled={salvando || carregandoIntervalo}
                >

                    <Ionicons
                        name={editando ? "checkmark" : "add"}
                        size={20}
                        color={cores.marrom}
                    />

                    <Text style={styles.botaoTexto}>
                        {salvando
                            ? "Salvando..."
                            : editando
                                ? "Salvar alterações"
                                : "Adicionar"}
                    </Text>

                </Pressable>

                {editando && (
                    <Pressable
                        onPress={limparFormulario}
                        disabled={salvando}
                    >
                        <Text style={styles.link}>
                            Cancelar edição
                        </Text>
                    </Pressable>
                )}

            </View>

            {registros.length === 0 && (
                <Text style={styles.vazio}>
                    Nenhum cuidado de higiene registrado.
                </Text>
            )}

            {registros.map(item => {

                const dataCuidado = converterData(item.data);

                const hoje = new Date();
                hoje.setHours(0, 0, 0, 0);

                const atrasado = !item.concluido && dataCuidado && dataCuidado < hoje;

                const paraHoje = !item.concluido &&
                    dataCuidado &&
                    dataCuidado.getTime() === hoje.getTime();

                return (
                    <View key={item.id} style={styles.item}>

                        <Pressable
                            style={[
                                styles.bola,
                                item.concluido && styles.bolaFeita
                            ]}
                            onPress={() => alterarStatus(item)}
                            disabled={salvando}
                            accessibilityRole="button"
                            accessibilityLabel="Alterar status do cuidado"
                        >

                            <Ionicons
                                name={item.concluido ? "checkmark" : "water-outline"}
                                size={20}
                                color={cores.marrom}
                            />

                        </Pressable>

                        <View style={styles.textos}>

                            <Text style={[
                                styles.nome,
                                item.concluido && styles.nomeFeito
                            ]}>
                                {item.nome}
                            </Text>

                            <Text style={styles.informacao}>
                                {item.data}
                                {item.detalhes ? ` • ${item.detalhes}` : ""}
                            </Text>

                            {/* Exibe o status do cuidado. */}
                            <Text style={[
                                styles.status,
                                atrasado && { color: cores.erro },
                                paraHoje && { color: cores.laranja }
                            ]}>
                                {item.concluido
                                    ? "Realizado"
                                    : atrasado
                                        ? "Atrasado"
                                        : paraHoje
                                            ? "Previsto para hoje"
                                            : "Agendado"}
                            </Text>

                        </View>

                        {/* Botão de edição. */}
                        <Pressable
                            onPress={() => editar(item)}
                            disabled={salvando}
                            style={styles.iconeAcao}
                            accessibilityLabel="Editar cuidado"
                        >
                            <Ionicons
                                name="pencil"
                                size={18}
                                color={cores.marromClaro}
                            />
                        </Pressable>

                        {/* Botão de exclusão. */}
                        <Pressable
                            onPress={() => excluir(item.id)}
                            disabled={salvando}
                            style={styles.iconeAcao}
                            accessibilityLabel="Excluir cuidado"
                        >
                            <Ionicons
                                name="trash-outline"
                                size={19}
                                color={cores.erro}
                            />
                        </Pressable>

                    </View>
                );
            })}
        </>
    );
}

const styles = StyleSheet.create({

    tituloSecao: {
        fontFamily: fontes.negrito,
        fontSize: 24,
        lineHeight: 32,
        color: cores.marrom,
        marginTop: 22,
        marginBottom: 10,
    },

    card: {
        backgroundColor: cores.branco,
        borderRadius: 25,
        padding: 14,
        marginBottom: 10,
        ...sombra,
    },

    label: {
        fontFamily: fontes.negrito,
        fontSize: 16,
        color: cores.marromClaro,
        marginBottom: 10,
    },

    opcoes: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 14,
    },

    opcao: {
        backgroundColor: "#FFF1DC",
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#F2DFC4",
        paddingVertical: 8,
        paddingHorizontal: 14,
    },

    opcaoSelecionada: {
        backgroundColor: cores.laranja,
        borderColor: cores.laranja,
    },

    textoOpcao: {
        fontFamily: fontes.negrito,
        fontSize: 15,
        color: cores.marrom,
    },

    campo: {
        minHeight: 50,
        backgroundColor: cores.branco,
        borderWidth: 1.5,
        borderColor: cores.laranja,
        borderRadius: 15,
        paddingHorizontal: 14,
        fontFamily: fontes.regular,
        fontSize: 16,
        color: cores.marrom,
        marginBottom: 10,
    },

    campoGrande: {
        height: 80,
        paddingTop: 12,
        textAlignVertical: "top",
    },

    linhaRealizado: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 6,
        marginBottom: 10,
    },

    repeticao: {
        marginBottom: 14,
        padding: 12,
        backgroundColor: "#FFF1DC",
        borderRadius: 18,
    },

    linhaRepeticao: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    linhaIntervalo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginTop: 8,
    },

    campoIntervalo: {
        width: 75,
        minHeight: 42,
        textAlign: "center",
        marginBottom: 0,
    },

    textoAjuda: {
        fontFamily: fontes.regular,
        fontSize: 14,
        lineHeight: 20,
        color: cores.marromClaro,
        marginTop: 10,
    },

    proximaData: {
        fontFamily: fontes.negrito,
        fontSize: 15,
        color: cores.marrom,
        marginTop: 8,
    },

    botao: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        height: 48,
        borderRadius: 24,
        backgroundColor: cores.laranja,
    },

    botaoTexto: {
        fontFamily: fontes.negrito,
        fontSize: 17,
        color: cores.marrom,
    },

    link: {
        fontFamily: fontes.negrito,
        fontSize: 15,
        color: cores.marromClaro,
        textAlign: "center",
        marginTop: 10,
    },

    item: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: cores.branco,
        borderRadius: 22,
        padding: 12,
        marginBottom: 10,
        ...sombra,
    },

    bola: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: cores.laranja,
        alignItems: "center",
        justifyContent: "center",
    },

    bolaFeita: {
        backgroundColor: "rgba(51, 39, 22, 0.08)",
    },

    textos: {
        flex: 1,
        minWidth: 0,
    },

    nome: {
        fontFamily: fontes.negrito,
        fontSize: 16,
        lineHeight: 22,
        color: cores.marrom,
    },

    nomeFeito: {
        color: cores.marromClaro,
        textDecorationLine: "line-through",
    },

    informacao: {
        fontFamily: fontes.regular,
        fontSize: 13,
        lineHeight: 18,
        color: cores.marromClaro,
    },

    status: {
        fontFamily: fontes.negrito,
        fontSize: 12,
        lineHeight: 18,
        color: cores.marromClaro,
    },

    iconeAcao: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: "center",
        justifyContent: "center",
    },

    vazio: {
        fontFamily: fontes.regular,
        fontSize: 15,
        lineHeight: 22,
        color: cores.marromClaro,
        textAlign: "center",
        paddingVertical: 10,
    },

    pressionado: {
        opacity: 0.7,
    },

});