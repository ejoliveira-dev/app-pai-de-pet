
import { listarPets, listarVacinas } from "../database/Database";
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

export async function verificarAvisosVacinas(db) {
    const pets = await listarPets(db);

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    for (const pet of pets) {
        const vacinas = await listarVacinas(db, pet.id_pet);

        for (const vacina of vacinas) {
            if (vacina.aplicada) continue;

            const dataVacina = converterData(vacina.data);
            if (!dataVacina) continue;

            const dias = Math.round((dataVacina - hoje) / 86400000);
            if (dias > 7) continue;

            let titulo;
            let mensagem;
            let situacao;

            if (dias < 0) {
                situacao = "atrasada";
                titulo = "Vacina pendente 💉";
                mensagem = `A vacina ${vacina.nome} de ${pet.nome} estava prevista para ${vacina.data}.`;
            } else if (dias === 0) {
                situacao = "hoje";
                titulo = "Vacina marcada para hoje! 💉";
                mensagem = `${pet.nome} tem a vacina ${vacina.nome} prevista para hoje.`;
            } else {
                situacao = "proxima";
                titulo = "Vacina se aproximando 💉";
                mensagem = `Faltam ${dias} dias para a vacina ${vacina.nome} de ${pet.nome}.`;
            }

            await adicionarNotificacao({
                id: `vacina_${pet.id_pet}_${vacina.id}_${situacao}_${vacina.data}`,
                tipo: "vacina",
                titulo,
                mensagem
            }, db);
        }
    }
}
