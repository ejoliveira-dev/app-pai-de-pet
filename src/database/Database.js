import AsyncStorage from "@react-native-async-storage/async-storage";

// ---------------------------------------------------------------
// banco de dados do Tutus (SQLite)
// arquivo: src/database/Database.js
// ---------------------------------------------------------------

const ESQUEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS pets (
    id_pet                TEXT PRIMARY KEY NOT NULL,
    id_usuario            TEXT,
    nome                  TEXT NOT NULL,
    especie               TEXT NOT NULL,
    raca                  TEXT,
    data_nascimento       TEXT,
    idade_Aproximada      TEXT,
    tipo_informacao_idade TEXT,
    foto_perfil           TEXT,
    observacoes           TEXT
);

CREATE TABLE IF NOT EXISTS publicacoes (
    id         TEXT PRIMARY KEY NOT NULL,
    id_pet     TEXT,
    nome_pet   TEXT,
    foto_pet   TEXT,
    foto_uri   TEXT,
    legenda    TEXT,
    criado_em  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS configuracoes (
    chave  TEXT PRIMARY KEY NOT NULL,
    valor  TEXT
);

CREATE TABLE IF NOT EXISTS registros (
    id      TEXT PRIMARY KEY NOT NULL,
    id_pet  TEXT NOT NULL,
    tipo    TEXT NOT NULL,
    valor   REAL NOT NULL,
    data    TEXT NOT NULL,
    FOREIGN KEY (id_pet) REFERENCES pets (id_pet) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS vacinas (
    id        TEXT PRIMARY KEY NOT NULL,
    id_pet    TEXT NOT NULL,
    nome      TEXT NOT NULL,
    data      TEXT NOT NULL,
    aplicada  INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (id_pet) REFERENCES pets (id_pet) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cuidados (
    id         TEXT PRIMARY KEY NOT NULL,
    id_pet     TEXT NOT NULL,
    tipo       TEXT NOT NULL,
    nome       TEXT NOT NULL,
    data       TEXT NOT NULL,
    detalhes   TEXT,
    concluido  INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (id_pet) REFERENCES pets (id_pet) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_registros_pet ON registros (id_pet, tipo);
CREATE INDEX IF NOT EXISTS idx_vacinas_pet   ON vacinas (id_pet);
CREATE INDEX IF NOT EXISTS idx_cuidados_pet  ON cuidados (id_pet, tipo);
`;

export async function inicializarBanco(db) {
    await db.execAsync(ESQUEMA);
    await migrarDoAsyncStorage(db);
    await migrarCuidadosDoAsyncStorage(db);
}

// ---------------------------------------------------------------
// configurações (chave/valor)
// ---------------------------------------------------------------

export async function obterConfig(db, chave) {
    const linha = await db.getFirstAsync(
        "SELECT valor FROM configuracoes WHERE chave = ?",
        [chave]
    );

    return linha?.valor ?? null;
}

export async function salvarConfig(db, chave, valor) {
    await db.runAsync(
        "INSERT OR REPLACE INTO configuracoes (chave, valor) VALUES (?, ?)",
        [chave, valor === null || valor === undefined ? null : String(valor)]
    );
}

// pet selecionado
export async function obterPetSelecionadoId(db) {
    return obterConfig(db, "petSelecionadoId");
}

export async function definirPetSelecionadoId(db, idPet) {
    await salvarConfig(db, "petSelecionadoId", idPet);
}

// perfil do tutor 
export async function obterPerfilTutor(db) {
    const texto = await obterConfig(db, "perfilTutor");

    if (!texto) return {};

    try {
        const dados = JSON.parse(texto);
        return dados && typeof dados === "object" ? dados : {};
    } catch (erro) {
        return {};
    }
}

export async function salvarPerfilTutor(db, perfil) {
    await salvarConfig(db, "perfilTutor", JSON.stringify(perfil));
}

// intervalo entre refeições de cada pet (em horas)
export async function obterIntervaloAlimentacao(db, idPet) {
    return obterConfig(db, `intervaloAlimentacao:${idPet}`);
}

export async function salvarIntervaloAlimentacao(db, idPet, horas) {
    await salvarConfig(db, `intervaloAlimentacao:${idPet}`, horas);
}

// biografia do perfil público de cada pet
export async function obterBioPublica(db, idPet) {
    return obterConfig(db, `bioPublica:${idPet}`);
}

export async function salvarBioPublica(db, idPet, bio) {
    await salvarConfig(db, `bioPublica:${idPet}`, bio);
}

// ---------------------------------------------------------------
// pets...
// ---------------------------------------------------------------

export async function listarPets(db) {
    // mais novos primeiro (igual ao seu arquivo)
    return db.getAllAsync("SELECT * FROM pets ORDER BY rowid DESC");
}

export async function buscarPet(db, idPet) {
    const pet = await db.getFirstAsync(
        "SELECT * FROM pets WHERE id_pet = ?",
        [String(idPet)]
    );

    return pet || null;
}

export async function inserirPet(db, pet) {
    await db.runAsync(
        `INSERT INTO pets (
            id_pet, id_usuario, nome, especie, raca,
            data_nascimento, idade_Aproximada, tipo_informacao_idade,
            foto_perfil, observacoes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            String(pet.id_pet),
            pet.id_usuario ?? 'usuario_demo',
            pet.nome,
            pet.especie,
            pet.raca ?? '',
            pet.data_nascimento ?? null,
            pet.idade_Aproximada ?? null,
            pet.tipo_informacao_idade ?? 'aproximada',
            pet.foto_perfil ?? null,
            pet.observacoes ?? '',
        ]
    );
}

export async function atualizarPet(db, pet) {
    await db.runAsync(
        `UPDATE pets SET
            nome = ?,
            especie = ?,
            raca = ?,
            data_nascimento = ?,
            idade_Aproximada = ?,
            tipo_informacao_idade = ?,
            foto_perfil = ?,
            observacoes = ?
        WHERE id_pet = ?`,
        [
            pet.nome,
            pet.especie,
            pet.raca ?? '',
            pet.data_nascimento ?? null,
            pet.idade_Aproximada ?? null,
            pet.tipo_informacao_idade ?? 'aproximada',
            pet.foto_perfil ?? null,
            pet.observacoes ?? '',
            String(pet.id_pet),
        ]
    );
}

export async function excluirPet(db, idPet) {
    const id = String(idPet);

    // apaga também tudo o que pertence ao pet.
    await db.runAsync("DELETE FROM registros WHERE id_pet = ?", [id]);
    await db.runAsync("DELETE FROM vacinas WHERE id_pet = ?", [id]);
    await db.runAsync("DELETE FROM cuidados WHERE id_pet = ?", [id]);
    await db.runAsync(
        "DELETE FROM configuracoes WHERE chave IN (?, ?)",
        [`intervaloAlimentacao:${id}`, `bioPublica:${id}`]
    );
    await db.runAsync("DELETE FROM pets WHERE id_pet = ?", [id]);

    // se o pet excluído era o selecionado, limpa a seleção
    const selecionado = await obterPetSelecionadoId(db);

    if (selecionado !== null && String(selecionado) === id) {
        await db.runAsync(
            "DELETE FROM configuracoes WHERE chave = 'petSelecionadoId'"
        );
    }
}

// ---------------------------------------------------------------
// publicações da comunidade...
// ---------------------------------------------------------------

export async function listarPublicacoes(db) {
    return db.getAllAsync(
        "SELECT * FROM publicacoes ORDER BY criado_em DESC"
    );
}

export async function inserirPublicacao(db, post) {
    await db.runAsync(
        `INSERT INTO publicacoes (
            id, id_pet, nome_pet, foto_pet, foto_uri, legenda, criado_em
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            String(post.id),
            post.id_pet !== undefined && post.id_pet !== null
                ? String(post.id_pet)
                : null,
            post.nome_pet ?? null,
            post.foto_pet ?? null,
            post.foto_uri ?? null,
            post.legenda ?? "",
            post.criado_em,
        ]
    );
}

// ---------------------------------------------------------------
// registros de alimentação e peso...
// ---------------------------------------------------------------

// devolve { alimentacao: [...], peso: [...] }, do mais novo para o mais antigo.
export async function listarRegistros(db, idPet) {
    const linhas = await db.getAllAsync(
        `SELECT id, tipo, valor, data
         FROM registros
         WHERE id_pet = ?
         ORDER BY data DESC, rowid DESC`,
        [String(idPet)]
    );

    const resultado = { alimentacao: [], peso: [] };

    for (const linha of linhas) {
        if (resultado[linha.tipo]) {
            resultado[linha.tipo].push({
                id: linha.id,
                valor: linha.valor,
                data: linha.data,
            });
        }
    }

    return resultado;
}

// tipo: "alimentacao" ou "peso".
export async function inserirRegistro(db, idPet, tipo, registro) {
    await db.runAsync(
        `INSERT INTO registros (id, id_pet, tipo, valor, data)
         VALUES (?, ?, ?, ?, ?)`,
        [
            String(registro.id),
            String(idPet),
            tipo,
            Number(registro.valor),
            registro.data,
        ]
    );
}

export async function removerRegistro(db, idRegistro) {
    await db.runAsync("DELETE FROM registros WHERE id = ?", [String(idRegistro)]);
}

// ---------------------------------------------------------------
// vacinas...
// ---------------------------------------------------------------

export async function listarVacinas(db, idPet) {
    const linhas = await db.getAllAsync(
        `SELECT id, nome, data, aplicada
         FROM vacinas
         WHERE id_pet = ?
         ORDER BY rowid DESC`,
        [String(idPet)]
    );

    return linhas.map((linha) => ({
        id: linha.id,
        nome: linha.nome,
        data: linha.data,
        aplicada: !!linha.aplicada,
    }));
}

export async function inserirVacina(db, idPet, vacina) {
    await db.runAsync(
        `INSERT INTO vacinas (id, id_pet, nome, data, aplicada)
         VALUES (?, ?, ?, ?, ?)`,
        [
            String(vacina.id),
            String(idPet),
            vacina.nome,
            vacina.data,
            vacina.aplicada ? 1 : 0,
        ]
    );
}

export async function alterarStatusVacina(db, idVacina, aplicada) {
    await db.runAsync(
        "UPDATE vacinas SET aplicada = ? WHERE id = ?",
        [aplicada ? 1 : 0, String(idVacina)]
    );
}

export async function removerVacina(db, idVacina) {
    await db.runAsync("DELETE FROM vacinas WHERE id = ?", [String(idVacina)]);
}

// ---------------------------------------------------------------
// cuidados (consultas e medicamentos)...
// ---------------------------------------------------------------

// tipo: "consulta" ou "medicamento"
export async function listarCuidados(db, idPet, tipo) {
    const linhas = await db.getAllAsync(
        `SELECT id, nome, data, detalhes, concluido
         FROM cuidados
         WHERE id_pet = ? AND tipo = ?
         ORDER BY rowid DESC`,
        [String(idPet), tipo]
    );

    return linhas.map((linha) => ({
        id: linha.id,
        nome: linha.nome,
        data: linha.data,
        detalhes: linha.detalhes ?? "",
        concluido: !!linha.concluido,
    }));
}

export async function inserirCuidado(db, idPet, tipo, cuidado) {
    await db.runAsync(
        `INSERT INTO cuidados (id, id_pet, tipo, nome, data, detalhes, concluido)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            String(cuidado.id),
            String(idPet),
            tipo,
            cuidado.nome,
            cuidado.data,
            cuidado.detalhes ?? "",
            cuidado.concluido ? 1 : 0,
        ]
    );
}

export async function atualizarCuidado(db, cuidado) {
    await db.runAsync(
        `UPDATE cuidados SET
            nome = ?, data = ?, detalhes = ?, concluido = ?
         WHERE id = ?`,
        [
            cuidado.nome,
            cuidado.data,
            cuidado.detalhes ?? "",
            cuidado.concluido ? 1 : 0,
            String(cuidado.id),
        ]
    );
}

export async function alterarStatusCuidado(db, idCuidado, concluido) {
    await db.runAsync(
        "UPDATE cuidados SET concluido = ? WHERE id = ?",
        [concluido ? 1 : 0, String(idCuidado)]
    );
}

export async function removerCuidado(db, idCuidado) {
    await db.runAsync("DELETE FROM cuidados WHERE id = ?", [String(idCuidado)]);
}

// ---------------------------------------------------------------
// tudo o que o painel da Home precisa, de uma vez só...
// ---------------------------------------------------------------

export async function carregarResumoPet(db, idPet) {
    const [registros, vacinas, consultas, medicamentos, intervalo] =
        await Promise.all([
            listarRegistros(db, idPet),
            listarVacinas(db, idPet),
            listarCuidados(db, idPet, "consulta"),
            listarCuidados(db, idPet, "medicamento"),
            obterIntervaloAlimentacao(db, idPet),
        ]);

    return {
        alimentacao: registros.alimentacao,
        peso: registros.peso,
        vacinas,
        consultas,
        medicamentos,
        intervalo, // texto com as horas, ou null
    };
}

// ---------------------------------------------------------------
// migração 1: pets, publicações, perfil do tutor e pet selecionado
// (os dados antigos continuam no AsyncStorage, nada é apagado)...
// ---------------------------------------------------------------

async function migrarDoAsyncStorage(db) {
    const jaMigrou = await obterConfig(db, "migrado_asyncstorage");

    if (jaMigrou) return;

    try {
        const [dadosPets, dadosPosts, dadosTutor, idSelecionado] =
            await Promise.all([
                AsyncStorage.getItem("@tutus:pets"),
                AsyncStorage.getItem("@tutus:publicacoes"),
                AsyncStorage.getItem("@tutus:perfilTutor"),
                AsyncStorage.getItem("@tutus:petSelecionadoId"),
            ]);

        const pets = dadosPets ? JSON.parse(dadosPets) : [];
        const posts = dadosPosts ? JSON.parse(dadosPosts) : [];

        await db.withTransactionAsync(async () => {
            if (Array.isArray(pets)) {
                for (const pet of pets) {
                    if (!pet?.id_pet || !pet?.nome || !pet?.especie) continue;

                    await db.runAsync(
                        `INSERT OR IGNORE INTO pets (
                            id_pet, id_usuario, nome, especie, raca,
                            data_nascimento, idade_Aproximada,
                            tipo_informacao_idade, foto_perfil, observacoes
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            String(pet.id_pet),
                            pet.id_usuario ?? 'usuario_demo',
                            pet.nome,
                            pet.especie,
                            pet.raca ?? '',
                            pet.data_nascimento ?? null,
                            pet.idade_Aproximada ?? null,
                            pet.tipo_informacao_idade ?? 'aproximada',
                            pet.foto_perfil ?? null,
                            pet.observacoes ?? '',
                        ]
                    );
                }
            }

            if (Array.isArray(posts)) {
                for (const post of posts) {
                    if (!post?.id || !post?.criado_em) continue;

                    await db.runAsync(
                        `INSERT OR IGNORE INTO publicacoes (
                            id, id_pet, nome_pet, foto_pet,
                            foto_uri, legenda, criado_em
                        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [
                            String(post.id),
                            post.id_pet !== undefined && post.id_pet !== null
                                ? String(post.id_pet)
                                : null,
                            post.nome_pet ?? null,
                            post.foto_pet ?? null,
                            post.foto_uri ?? null,
                            post.legenda ?? "",
                            post.criado_em,
                        ]
                    );
                }
            }

            if (dadosTutor) {
                await db.runAsync(
                    "INSERT OR IGNORE INTO configuracoes (chave, valor) VALUES (?, ?)",
                    ["perfilTutor", dadosTutor]
                );
            }

            if (idSelecionado) {
                await db.runAsync(
                    "INSERT OR IGNORE INTO configuracoes (chave, valor) VALUES (?, ?)",
                    ["petSelecionadoId", idSelecionado]
                );
            }

            await db.runAsync(
                "INSERT OR REPLACE INTO configuracoes (chave, valor) VALUES (?, ?)",
                ["migrado_asyncstorage", "1"]
            );
        });
    } catch (erro) {
        // se falhar, tenta de novo na próxima abertura do app
        console.error("Erro ao migrar dados do AsyncStorage:", erro);
    }
}

// ---------------------------------------------------------------
// migração 2: registros, vacinas, consultas, medicamentos,
// intervalo de alimentação e biografia de cada pet...
// ---------------------------------------------------------------

function lerLista(texto) {
    if (!texto) return [];

    try {
        const dados = JSON.parse(texto);
        return Array.isArray(dados) ? dados : [];
    } catch (erro) {
        return [];
    }
}

function lerObjeto(texto) {
    if (!texto) return {};

    try {
        const dados = JSON.parse(texto);

        return dados && typeof dados === "object" && !Array.isArray(dados)
            ? dados
            : {};
    } catch (erro) {
        return {};
    }
}

async function migrarCuidadosDoAsyncStorage(db) {
    const jaMigrou = await obterConfig(db, "migrado_cuidados");

    if (jaMigrou) return;

    try {
        const pets = await db.getAllAsync("SELECT id_pet FROM pets");

        // lê tudo do AsyncStorage antes de abrir a transação
        const lidos = [];

        for (const { id_pet } of pets) {
            const [registros, vacinas, consultas, medicamentos, horas, bio] =
                await Promise.all([
                    AsyncStorage.getItem(`@tutus:registros:${id_pet}`),
                    AsyncStorage.getItem(`@tutus:vacinas:${id_pet}`),
                    AsyncStorage.getItem(`@tutus:cuidados:consulta:${id_pet}`),
                    AsyncStorage.getItem(`@tutus:cuidados:medicamento:${id_pet}`),
                    AsyncStorage.getItem(`@tutus:intervaloAlimentacao:${id_pet}`),
                    AsyncStorage.getItem(`@tutus:bioPublica:${id_pet}`),
                ]);

            lidos.push({
                id_pet,
                registros: lerObjeto(registros),
                vacinas: lerLista(vacinas),
                consultas: lerLista(consultas),
                medicamentos: lerLista(medicamentos),
                horas,
                bio,
            });
        }

        await db.withTransactionAsync(async () => {
            for (const pet of lidos) {
                // alimentação e peso (já ordenados pela data)
                for (const tipo of ["alimentacao", "peso"]) {
                    const lista = Array.isArray(pet.registros[tipo])
                        ? pet.registros[tipo]
                        : [];

                    for (const item of lista) {
                        const valor = Number(item?.valor);

                        if (!item?.id || !item?.data || !(valor > 0)) continue;

                        await db.runAsync(
                            `INSERT OR IGNORE INTO registros
                                (id, id_pet, tipo, valor, data)
                             VALUES (?, ?, ?, ?, ?)`,
                            [String(item.id), pet.id_pet, tipo, valor, String(item.data)]
                        );
                    }
                }

                // as listas antigas guardavam o mais novo primeiro;
                // inserimos de trás para frente para manter a mesma ordem
                for (const item of [...pet.vacinas].reverse()) {
                    if (!item?.id || !item?.nome || !item?.data) continue;

                    await db.runAsync(
                        `INSERT OR IGNORE INTO vacinas
                            (id, id_pet, nome, data, aplicada)
                         VALUES (?, ?, ?, ?, ?)`,
                        [
                            String(item.id),
                            pet.id_pet,
                            item.nome,
                            item.data,
                            item.aplicada ? 1 : 0,
                        ]
                    );
                }

                for (const [tipo, lista] of [
                    ["consulta", pet.consultas],
                    ["medicamento", pet.medicamentos],
                ]) {
                    for (const item of [...lista].reverse()) {
                        if (!item?.id || !item?.nome || !item?.data) continue;

                        await db.runAsync(
                            `INSERT OR IGNORE INTO cuidados
                                (id, id_pet, tipo, nome, data, detalhes, concluido)
                             VALUES (?, ?, ?, ?, ?, ?, ?)`,
                            [
                                String(item.id),
                                pet.id_pet,
                                tipo,
                                item.nome,
                                item.data,
                                item.detalhes ?? "",
                                item.concluido ? 1 : 0,
                            ]
                        );
                    }
                }

                if (pet.horas) {
                    await db.runAsync(
                        "INSERT OR IGNORE INTO configuracoes (chave, valor) VALUES (?, ?)",
                        [`intervaloAlimentacao:${pet.id_pet}`, pet.horas]
                    );
                }

                if (pet.bio) {
                    await db.runAsync(
                        "INSERT OR IGNORE INTO configuracoes (chave, valor) VALUES (?, ?)",
                        [`bioPublica:${pet.id_pet}`, pet.bio]
                    );
                }
            }

            await db.runAsync(
                "INSERT OR REPLACE INTO configuracoes (chave, valor) VALUES (?, ?)",
                ["migrado_cuidados", "1"]
            );
        });
    } catch (erro) {
        console.error("Erro ao migrar cuidados do AsyncStorage:", erro);
    }
}