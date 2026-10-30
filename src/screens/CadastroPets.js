import React, { useState, useEffect } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { inserirPet, atualizarPet } from "../database/Database";

import { View, Image, Text, TextInput, TouchableOpacity, Pressable, ScrollView, Alert, Modal, KeyboardAvoidingView, Platform } from "react-native";

import * as ImagePicker from "expo-image-picker";
import { File, Paths } from "expo-file-system";
import { Ionicons } from "@expo/vector-icons";

import { style } from "../styles/CadastroPetStyles";

const cores = {
    fundo: "#FFFDF8",
    laranja: "#FA9F2A",
    marrom: "#332716",
    marromMedio: "#75571F",
    placeholder: "#9A8A75",
};

const ESPECIES = [
    "Gato",
    "Cachorro",
    "Coelho",
    "Hamster",
    "Porquinho-da-índia",
    "Tartaruga",
    "Peixe",
    "Calopsita",
    "Periquito",
    "Canário",
    "Papagaio",
    "Furão",
    "Outro tipo de pássaro",
    "A espécie do meu pet não está aqui :(",
];

const IDADES = [
    "Menos de 1 ano",
    "1 ano",
    "2 anos",
    "3 anos",
    "4 anos",
    "5 anos",
    "6 anos",
    "7 anos",
    "8 anos",
    "9 anos",
    "10 anos ou mais",
    "Mais de 1 ano (não sei ao certo)",
    "Não sei a idade",
];

const OUTRA_ESPECIE = ESPECIES[ESPECIES.length - 1];

export default function CadastroPet({ navigation, route }) {
    const db = useSQLiteContext();
    const petParaEditar = route.params?.petParaEditar;
    const modoEdicao = !!petParaEditar;

    const [nome, setNome] = useState("");
    const [especie, setEspecie] = useState("");
    const [erroEspecie, setErroEspecie] = useState(false);
    const [outraEspecie, setOutraEspecie] = useState("");
    const [raca, setRaca] = useState("");
    const [foto, setFoto] = useState(null);

    // para o tutor informar a data ou uma estimativa
    const [modoIdade, setModoIdade] = useState("aproximada");
    const [dataNascimento, setDataNascimento] = useState("");

    function formatarData(texto) {
        const numeros = texto.replace(/\D/g, "").slice(0, 8);

        if (numeros.length > 4) {
            return (
                numeros.slice(0, 2) + "/" +
                numeros.slice(2, 4) + "/" +
                numeros.slice(4)
            );
        }

        if (numeros.length > 2) {
            return numeros.slice(0, 2) + "/" + numeros.slice(2);
        }

        return numeros;
    }

    const [idadeAproximada, setIdadeAproximada] = useState("Não sei a idade");

    const [observacoes, setObservacoes] = useState("");
    const [salvando, setSalvando] = useState(false);

    // controla a lista de seleção aberta
    const [modalTipo, setModalTipo] = useState(null);

    useEffect(() => {
        if (!petParaEditar) return;

        setNome(petParaEditar.nome || "");
        setRaca(petParaEditar.raca || "");
        setFoto(petParaEditar.foto_perfil || null);
        setObservacoes(petParaEditar.observacoes || "");

        const especieCadastrada = petParaEditar.especie || "";

        if (ESPECIES.includes(especieCadastrada)) {
            setEspecie(especieCadastrada);
        } else {
            setEspecie(OUTRA_ESPECIE);
            setOutraEspecie(especieCadastrada);
        }

        setModoIdade(
            petParaEditar.tipo_informacao_idade || "aproximada"
        );

        setDataNascimento(petParaEditar.data_nascimento || "");

        setIdadeAproximada(
            petParaEditar.idade_Aproximada || "Não sei a idade"
        );
    }, [petParaEditar]);

    // verifica se uma data é válida.
    function dataValida(valor) {
        const partes = valor.split("/");

        if (partes.length !== 3) {
            return false;
        }

        const dia = Number(partes[0]);
        const mes = Number(partes[1]);
        const ano = Number(partes[2]);

        if (
            partes[0].length !== 2 ||
            partes[1].length !== 2 ||
            partes[2].length !== 4
        ) {
            return false;
        }

        if (ano < 1900 || mes < 1 || mes > 12 || dia < 1) {
            return false;
        }

        const data = new Date(ano, mes - 1, dia);

        return (
            data.getFullYear() === ano &&
            data.getMonth() === mes - 1 &&
            data.getDate() === dia &&
            data <= new Date()
        );
    }

    // pra verificar os campos e salvar os pets no dispositivo.

    async function salvarPet() {
        const especieFinal =
            especie === OUTRA_ESPECIE
                ? outraEspecie.trim()
                : especie;

        if (!nome.trim()) {
            Alert.alert(
                "Atenção, humano!",
                "Por favor, lembre-se de preencher o nome do seu pet."
            );
            return;
        }

        if (!especieFinal) {
            setErroEspecie(true);
            return;
        }

        setErroEspecie(false);

        if (
            modoIdade === "data" &&
            !dataValida(dataNascimento.trim())
        ) {
            Alert.alert(
                "Data inválida",
                "Informe uma data válida no formato DD/MM/AAAA."
            );
            return;
        }

        if (salvando) return;

        setSalvando(true);

        try {
            // Cria um identificador único para o pet.
            const idPet = modoEdicao
                ? petParaEditar.id_pet
                : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

            // guarda a foto em um local permanente no dispositivo.
            let fotoSalva = foto; // mantém a foto atual se não foi trocada

            if (foto && foto !== petParaEditar?.foto_perfil) {
                const extensaoOriginal = foto
                    .split("?")[0]
                    .split(".")
                    .pop()
                    ?.toLowerCase();

                const extensao = ["jpg", "jpeg", "png", "heic", "webp"]
                    .includes(extensaoOriginal)
                    ? extensaoOriginal
                    : "jpg";

                const origem = new File(foto);

                const destino = new File(
                    Paths.document,
                    `pet-${idPet}.${extensao}`
                );

                await origem.copy(destino);
                fotoSalva = destino.uri;
            }

            // organiza os dados do novo pet.
            const novoPet = {
                id_pet: idPet,
                id_usuario: "usuario_demo",
                nome: nome.trim(),
                especie: especieFinal,
                raca: raca.trim(),
                data_nascimento: modoIdade === "data"
                    ? dataNascimento.trim()
                    : null,
                idade_Aproximada: modoIdade === "aproximada"
                    ? idadeAproximada
                    : null,
                tipo_informacao_idade: modoIdade,
                foto_perfil: fotoSalva,
                observacoes: observacoes.trim(),
            };

            // salva o pet diretamente no SQLite.
            if (modoEdicao) {
                await atualizarPet(db, novoPet);
            } else {
                await inserirPet(db, novoPet);
            }

            Alert.alert(
                "Cadastro realizado!",
                `${novoPet.nome} foi cadastrado com sucesso.`,
                [
                    {
                        text: "OK",
                        onPress: () => navigation.goBack(),
                    },
                ]
            );

        } catch (erro) {
            console.error("Erro ao salvar pet:", erro);

            Alert.alert(
                "Erro ao salvar",
                "Não foi possível cadastrar o pet. Tente novamente."
            );
        } finally {
            setSalvando(false);
        }
    }


    async function escolherFoto() {
        try {
            const resultado = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ["images"],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
            });

            if (!resultado.canceled && resultado.assets?.length > 0) {
                setFoto(resultado.assets[0].uri);
            }

        } catch (erro) {
            Alert.alert(
                "Erro",
                "Não foi possível selecionar a foto."
            );
        }
    }

    const opcoesModal =
        modalTipo === "especie" ? ESPECIES : IDADES;

    // opção atualmente escolhida na janela aberta
    const opcaoAtual =
        modalTipo === "especie" ? especie : idadeAproximada;

    function selecionarOpcao(opcao) {
        if (modalTipo === "especie") {
            setEspecie(opcao);
            setErroEspecie(opcao === OUTRA_ESPECIE && !outraEspecie.trim());
        } else {
            setIdadeAproximada(opcao);
        }

        setModalTipo(null);
    }

    return (
        <View style={style.container}>

            {/* topo laranja */}
            <View style={style.topoLaranja}>
                <View style={style.topoCirculo} />

                <Text style={style.titulo}>
                    {modoEdicao ? "Editar Pet" : "Cadastrar Pet"}
                </Text>
            </View>

            {/* painel branco */}
            <KeyboardAvoidingView
                style={style.painelBranco}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
                    contentContainerStyle={style.conteudo}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >

                    {/* foto */}
                    <View style={style.fotoContainer}>

                        <TouchableOpacity
                            style={style.fotoBotao}
                            onPress={escolherFoto}
                            activeOpacity={0.8}
                            accessibilityRole="button"
                            accessibilityLabel="Escolher foto do pet"
                        >
                            {foto ? (
                                <Image
                                    source={{ uri: foto }}
                                    style={style.fotoPreview}
                                />
                            ) : (
                                <Ionicons
                                    name="paw"
                                    size={46}
                                    color={cores.laranja}
                                />
                            )}

                            <View style={style.fotoBadge}>
                                <Ionicons
                                    name="camera"
                                    size={18}
                                    color={cores.fundo}
                                />
                            </View>
                        </TouchableOpacity>

                    </View>

                    {/* seção: sobre o pet */}
                    <View style={style.secao}>
                        <View style={style.barraSecao} />
                        <Text style={style.tituloSecao}>Sobre o pet</Text>
                    </View>

                    <Text style={style.label}>Nome do pet *</Text>
                    <TextInput
                        style={style.input}
                        placeholder="Digite o nome do pet"
                        placeholderTextColor={cores.placeholder}
                        value={nome}
                        onChangeText={setNome}
                    />

                    {/* para selecionar/colocar a espécie */}
                    <Text style={style.label}>Espécie *</Text>

                    <TouchableOpacity
                        style={style.seletor}
                        onPress={() => setModalTipo("especie")}
                        activeOpacity={0.8}
                    >
                        <Text
                            style={[
                                style.textoSeletor,
                                !especie && { color: cores.placeholder },
                            ]}
                        >
                            {especie || "Selecione a espécie do seu pet"}
                        </Text>
                        <Ionicons
                            name="chevron-down"
                            size={22}
                            color={cores.laranja}
                        />
                    </TouchableOpacity>

                    {especie === OUTRA_ESPECIE && (
                        <TextInput
                            style={[style.input, { marginTop: 10 }]}
                            placeholder="Qual é a espécie do seu pet?"
                            placeholderTextColor={cores.placeholder}
                            value={outraEspecie}
                            onChangeText={(texto) => {
                                setOutraEspecie(texto);
                                setErroEspecie(!texto.trim());
                            }}
                        />
                    )}

                    {erroEspecie && (
                        <Text style={style.mensagemErro}>
                            Por favor, selecione ou informe a espécie do seu pet.
                        </Text>
                    )}

                    <Text style={style.label}>Raça</Text>
                    <TextInput
                        style={style.input}
                        placeholder="Digite a raça (opcional)"
                        placeholderTextColor={cores.placeholder}
                        value={raca}
                        onChangeText={setRaca}
                    />

                    {/* seção: idade */}
                    <View style={style.secao}>
                        <View style={style.barraSecao} />
                        <Text style={style.tituloSecao}>Idade</Text>
                    </View>

                    <Text style={style.label}>
                        Você sabe quando seu pet nasceu?
                    </Text>

                    <TouchableOpacity
                        style={[
                            style.opcaoModo,
                            modoIdade === "data" &&
                            style.opcaoModoSelecionada,
                        ]}
                        onPress={() => setModoIdade("data")}
                        activeOpacity={0.8}
                    >
                        <Ionicons
                            name={modoIdade === "data" ? "radio-button-on" : "radio-button-off"}
                            size={24}
                            color={cores.laranja}
                        />
                        <Text style={style.textoOpcaoModo}>
                            Sim, sei a data de nascimento!
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            style.opcaoModo,
                            modoIdade === "aproximada" &&
                            style.opcaoModoSelecionada,
                        ]}
                        onPress={() => setModoIdade("aproximada")}
                        activeOpacity={0.8}
                    >
                        <Ionicons
                            name={modoIdade === "aproximada" ? "radio-button-on" : "radio-button-off"}
                            size={24}
                            color={cores.laranja}
                        />
                        <Text style={style.textoOpcaoModo}>
                            Não sei a data exata
                        </Text>
                    </TouchableOpacity>

                    {/* data exata */}
                    {modoIdade === "data" && (
                        <>
                            <Text style={style.label}>
                                Data de nascimento *
                            </Text>

                            <TextInput
                                style={style.input}
                                placeholder="DD/MM/AAAA"
                                placeholderTextColor={cores.placeholder}
                                value={dataNascimento}
                                onChangeText={(texto) => { setDataNascimento(formatarData(texto)) }}
                                keyboardType="numeric"
                                maxLength={10}
                            />
                        </>
                    )}

                    {/* Idade aproximada */}
                    {modoIdade === "aproximada" && (
                        <>
                            <Text style={style.label}>
                                Idade aproximada
                            </Text>

                            <TouchableOpacity
                                style={style.seletor}
                                onPress={() => setModalTipo("idade")}
                                activeOpacity={0.8}
                            >
                                <Text style={style.textoSeletor}>
                                    {idadeAproximada}
                                </Text>
                                <Ionicons
                                    name="chevron-down"
                                    size={22}
                                    color={cores.laranja}
                                />
                            </TouchableOpacity>
                        </>
                    )}

                    <Text style={style.textoAjuda}>
                        Não tem problema se você não souber a idade
                        exata do seu companheiro!
                    </Text>

                    {/* seção: mais detalhes */}
                    <View style={style.secao}>
                        <View style={style.barraSecao} />
                        <Text style={style.tituloSecao}>Mais detalhes</Text>
                    </View>

                    <Text style={style.label}>Observações</Text>
                    <TextInput
                        style={[style.input, style.inputGrande]}
                        placeholder="Conte um pouquinho sobre seu pet..."
                        placeholderTextColor={cores.placeholder}
                        value={observacoes}
                        onChangeText={setObservacoes}
                        multiline
                        textAlignVertical="top"
                    />

                    <TouchableOpacity
                        style={style.botaoSalvar}
                        onPress={salvarPet}
                        disabled={salvando}
                        activeOpacity={0.85}
                    >
                        <Text style={style.textoBotao}>
                            {salvando
                                ? "Salvando..."
                                : modoEdicao
                                    ? "Salvar alterações"
                                    : "Salvar Pet"}
                        </Text>
                    </TouchableOpacity>
                </ScrollView>

                {/* rodapé */}
                <View style={style.rodape}>
                    <Pressable
                        style={style.botaoVoltar}
                        onPress={() => navigation.goBack()}
                        accessibilityRole="button"
                        accessibilityLabel="Voltar"
                    >
                        <Ionicons
                            name="arrow-back"
                            size={25}
                            color={cores.fundo}
                        />
                    </Pressable>
                </View>
            </KeyboardAvoidingView>

            {/* JANELA DE SELEÇÃO */}
            <Modal
                visible={modalTipo !== null}
                transparent
                animationType="slide"
                onRequestClose={() => setModalTipo(null)}
            >
                <View style={style.fundoModal}>
                    <View style={style.caixaModal}>
                        <View style={style.puxadorModal} />

                        <Text style={style.tituloModal}>
                            {modalTipo === "especie"
                                ? "Escolha a espécie"
                                : "Escolha a idade aproximada"}
                        </Text>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {opcoesModal.map((opcao) => {
                                const escolhida = opcao === opcaoAtual;

                                return (
                                    <TouchableOpacity
                                        key={opcao}
                                        style={[
                                            style.itemModal,
                                            escolhida && style.itemModalSelecionado,
                                        ]}
                                        onPress={() => selecionarOpcao(opcao)}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={style.textoItemModal}>
                                            {opcao}
                                        </Text>

                                        {escolhida && (
                                            <Ionicons
                                                name="checkmark-circle"
                                                size={22}
                                                color={cores.laranja}
                                            />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        <TouchableOpacity
                            style={style.fecharModal}
                            onPress={() => setModalTipo(null)}
                        >
                            <Text style={style.textoBotao}>
                                Fechar
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
