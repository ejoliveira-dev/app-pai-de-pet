
import { listarPets, listarCuidados } from "../database/Database";
import { adicionarNotificacao } from "./notificacoesStorage";

function converterData(valor) {
    if (!valor) return null;

    const texto = String(valor).trim();
    let ano, mes, dia;

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) {
        [dia, mes, ano] = texto.split("/").map(Number);
    } else if (/^\d{4}-\d{2}-\d{2}/.test(texto)) {
        [ano, mes, dia] = texto.slice(0, 10).split("-").map(Number);
    } else {
        return null;
    }

    const data = new Date(ano, mes - 1, dia);

    if (data.getFullYear() !== ano || data.getMonth() !== mes - 1 || data.getDate() !== dia) {
        return null;
    }

    return data;
}

export async function verificarAvisosCuidados(db) {
    const pets = await listarPets(db);

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    for (const pet of pets) {
        for (const tipo of ["consulta", "medicamento"]) {
            const cuidados = await listarCuidados(db, pet.id_pet, tipo);

            for (const cuidado of cuidados) {
                if (cuidado.concluido) continue;

                const dataCuidado = converterData(cuidado.data);
                if (!dataCuidado) continue;

                const dias = Math.round((dataCuidado - hoje) / 86400000);
                if (dias > 7) continue;

                let titulo;
                let mensagem;
                let situacao;

                const nomeTipo = tipo === "consulta" ? "consulta" : "medicamento";

                if (dias < 0) {
                    situacao = "atrasado";
                    titulo = tipo === "consulta" ? "Consulta pendente 📅" : "Medicamento pendente 💊";
                    mensagem = `${pet.nome}: ${cuidado.nome} estava previsto para ${cuidado.data}.`;
                } else if (dias === 0) {
                    situacao = "hoje";
                    titulo = tipo === "consulta" ? "Consulta marcada para hoje! 📅" : "Medicamento previsto para hoje! 💊";
                    mensagem = `${pet.nome} tem ${nomeTipo} (${cuidado.nome}) previsto para hoje.`;
                } else {
                    situacao = "proximo";
                    titulo = tipo === "consulta" ? "Consulta se aproximando 📅" : "Medicamento se aproximando 💊";
                    mensagem = `${pet.nome} tem ${nomeTipo} (${cuidado.nome}) em ${dias} ${dias === 1 ? "dia" : "dias"}.`;
                }

                await adicionarNotificacao({
                    id: `${tipo}_${pet.id_pet}_${cuidado.id}_${situacao}_${cuidado.data}`,
                    tipo,
                    titulo,
                    mensagem
                }, db);
            }
        }
    }
}
