
import React, { useState } from "react";
import { View, Image, Text, TextInput, TouchableOpacity, ScrollView, Alert, Modal } from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { File, Paths } from "expo-file-system";
import { Ionicons } from "@expo/vector-icons";

import { style } from "../styles/CadastroPetStyles";

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

export default function CadastroPet({ navigation }) {
    const [nome, setNome] = useState("");
    const [especie, setEspecie] = useState("");
    const [erroEspecie, setErroEspecie] = useState(false);
    const [outraEspecie, setOutraEspecie] = useState("");
    const [raca, setRaca] = useState("");
    const [foto, setFoto] = useState(null);

    // para o tutor informar a data ou uma estimativa
    const [modoIdade, setModoIdade] = useState("aproximada");
    const [dataNascimento, setDataNascimento] = useState("");
    const [idadeAproximada, setIdadeAproximada] = useState("Não sei a idade");

    const [observacoes, setObservacoes] = useState("");
    const [salvando, setSalvando] = useState(false);

    // controla a lista de seleção aberta
    const [modalTipo, setModalTipo] = useState(null);

    // verifica se uma data é válida.
    function dataValida(valor) {
        if (!/^\d{2}\/\d{2}\/\d{4}$/.test(valor)) {
            return false;
        }

        const [dia, mes, ano] = valor.split("/").map(Number);
        const data = new Date(ano, mes - 1, dia);

        return (
            ano >= 1900 &&
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
            // pra recuperar os pets já cadasreados
            const dadosSalvos = await AsyncStorage.getItem("@tutus:pets");

            const pets = dadosSalvos
                ? JSON.parse(dadosSalvos)
                : [];


            // cria um identificador para o novo pet.
            const idPet = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

            // guarda o endereço permanente da foto.
            let fotoSalva = null;

            if (foto) {
                const extensaoOriginal = foto.split("?")[0].split(".").pop()?.toLowerCase();

                const extensao = ["jpg", "jpeg", "png", "heic", "webp"].includes(extensaoOriginal)
                    ? extensaoOriginal
                    : "jpg";

                const origem = new File(foto);
                const destino = new File(
                    Paths.document,
                    `pet-${idPet}.${extensao}`
                );

                origem.copy(destino);
                fotoSalva = destino.uri;
            }

            // criar um novo pet com identificador único.
            const novoPet = {
                id_pet: idPet,
                id_usuario: "usuario_demo",
                nome: nome.trim(),
                especie: especieFinal,
                raca: raca.trim(),

                data_nascimento: modoIdade === "data" ? dataNascimento.trim() : null,

                idade_Aproximada: modoIdade === "aproximada" ? idadeAproximada : null,

                tipo_informacao_idade: modoIdade,

                foto_perfil: fotoSalva,
                observacoes: observacoes.trim(),
            };

            // adicionar o novo pet à lista existente.
            const listaAtualizada = [...pets, novoPet];

            // armazenar a lista no dispositivo.
            await AsyncStorage.setItem(
                "@tutus:pets",
                JSON.stringify(listaAtualizada)
            );

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
            <ScrollView
                contentContainerStyle={style.conteudo}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={style.titulo}>
                    Cadastrar Pet
                </Text>

                <Text style={style.subtitulo}>
                    Vamos conhecer seu companheiro?
                </Text>

                <View style={style.fotoContainer}>

                    <TouchableOpacity
                        style={style.fotoBotao}
                        onPress={escolherFoto}
                    >
                        {foto ? (
                            <Image
                                source={{ uri: foto }}
                                style={style.fotoPreview}
                            />
                        ) : (
                            <Ionicons
                                name="camera-outline"
                                size={40}
                                color="#FA9F2A"
                            />
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={escolherFoto}>
                        <Text style={style.textoAdicionarFoto}>
                            {foto ? "Alterar foto" : "+ Adicionar foto"}
                        </Text>
                    </TouchableOpacity>

                    <Text style={style.textoFotoOpcional}>
                        Opcional
                    </Text>

                </View>

                <Text style={style.label}>Nome do pet *</Text>
                <TextInput
                    style={style.input}
                    placeholder="Digite o nome do pet"
                    placeholderTextColor="#9A8A75"
                    value={nome}
                    onChangeText={setNome}
                />

                {/* para selecionar/colocar a espécie */}
                <Text style={style.label}>Espécie *</Text>

                <TouchableOpacity
                    style={style.seletor}
                    onPress={() => setModalTipo("especie")}
                >
                    <Text style={style.textoSeletor}>
                        {especie || "Selecione a espécie do seu pet"}
                    </Text>
                    <Text style={style.seta}>⌄</Text>
                </TouchableOpacity>

                {especie === OUTRA_ESPECIE && (
                    <TextInput
                        style={[style.input, { marginTop: 10 }]}
                        placeholder="Qual é a espécie do seu pet?"
                        placeholderTextColor="#9A8A75"
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
                    placeholderTextColor="#9A8A75"
                    value={raca}
                    onChangeText={setRaca}
                />

                {/* para idade do pet*/}
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
                >
                    <Text style={style.textoOpcaoModo}>
                        {modoIdade === "data" ? "◉" : "○"} Sim, sei a data de nascimento!
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        style.opcaoModo,
                        modoIdade === "aproximada" &&
                        style.opcaoModoSelecionada,
                    ]}
                    onPress={() => setModoIdade("aproximada")}
                >
                    <Text style={style.textoOpcaoModo}>
                        {modoIdade === "aproximada" ? "◉" : "○"} Não sei a data exata
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
                            placeholderTextColor="#9A8A75"
                            value={dataNascimento}
                            onChangeText={setDataNascimento}
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
                        >
                            <Text style={style.textoSeletor}>
                                {idadeAproximada}
                            </Text>
                            <Text style={style.seta}>⌄</Text>
                        </TouchableOpacity>
                    </>
                )}

                <Text style={style.textoAjuda}>
                    Não tem problema se você não souber a idade
                    exata do seu companheiro!
                </Text>


                <Text style={style.label}>Observações</Text>
                <TextInput
                    style={[style.input, style.inputGrande]}
                    placeholder="Conte um pouquinho sobre seu pet..."
                    placeholderTextColor="#9A8A75"
                    value={observacoes}
                    onChangeText={setObservacoes}
                    multiline
                    textAlignVertical="top"
                />

                <TouchableOpacity
                    style={style.botaoSalvar}
                    onPress={salvarPet}
                    disabled={salvando}
                >
                    <Text style={style.textoBotao}>
                        {salvando ? "Salvando..." : "Salvar Pet"}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={style.botaoVoltar}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={style.textoVoltar}>
                        Voltar
                    </Text>
                </TouchableOpacity>
            </ScrollView>

            {/* JANELA DE SELEÇÃO */}
            <Modal
                visible={modalTipo !== null}
                transparent
                animationType="slide"
                onRequestClose={() => setModalTipo(null)}
            >
                <View style={style.fundoModal}>
                    <View style={style.caixaModal}>
                        <Text style={style.tituloModal}>
                            {modalTipo === "especie"
                                ? "Escolha a espécie"
                                : "Escolha a idade aproximada"}
                        </Text>

                        <ScrollView>
                            {opcoesModal.map((opcao) => (
                                <TouchableOpacity
                                    key={opcao}
                                    style={style.itemModal}
                                    onPress={() => selecionarOpcao(opcao)}
                                >
                                    <Text style={style.textoItemModal}>
                                        {opcao}
                                    </Text>
                                </TouchableOpacity>
                            ))}
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
