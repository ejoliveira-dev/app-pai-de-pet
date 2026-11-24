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

const TIPOS = {
    consulta: { nome: "Consulta", icone: "📅", antecedencia: 7 },
    medicamento: { nome: "Medicamento", icone: "💊", antecedencia: 7 },
    higiene: { nome: "Higiene", icone: "🫧", antecedencia: 1 }
};

export async function verificarAvisosCuidados(db) {
    const pets = await listarPets(db);

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    for (const pet of pets) {
        for (const tipo of Object.keys(TIPOS)) {
            const cuidados = await listarCuidados(db, pet.id_pet, tipo);
            const config = TIPOS[tipo];

            for (const cuidado of cuidados) {

                // Não gera avisos para cuidados concluídos.
                if (cuidado.concluido) continue;

                const dataCuidado = converterData(cuidado.data);

                if (!dataCuidado) continue;

                const dias = Math.round((dataCuidado - hoje) / 86400000);

                if (dias > config.antecedencia) continue;

                let titulo;
                let mensagem;
                let situacao;

                if (dias < 0) {
                    situacao = "atrasado";
                    titulo = `${config.nome}: cuidado pendente ${config.icone}`;
                    mensagem = `${pet.nome}: ${cuidado.nome} estava previsto para ${cuidado.data}.`;

                } else if (dias === 0) {
                    situacao = "hoje";
                    titulo = `${config.nome}: previsto para hoje! ${config.icone}`;
                    mensagem = `${pet.nome} tem ${cuidado.nome} previsto para hoje.`;

                } else {
                    situacao = "proximo";
                    titulo = `${config.nome}: lembrete ${config.icone}`;
                    mensagem = `${pet.nome} tem ${cuidado.nome} em ${dias} ${dias === 1 ? "dia" : "dias"}.`;
                }

                // O ID identifica cada aviso para evitar notificações repetidas.
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