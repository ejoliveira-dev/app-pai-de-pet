
import { listarPets, listarRegistros, obterIntervaloAlimentacao } from "../database/Database";
import { adicionarNotificacao } from "./notificacoesStorage";

export async function verificarAvisosAlimentacao(db) {
    const pets = await listarPets(db);
    const agora = Date.now();

    for (const pet of pets) {
        const intervaloSalvo = await obterIntervaloAlimentacao(db, pet.id_pet);
        const intervalo = Number(intervaloSalvo);

        if (!intervaloSalvo || !Number.isInteger(intervalo) || intervalo < 1 || intervalo > 24) {
            continue;
        }

        const registros = await listarRegistros(db, pet.id_pet);

        const refeicoes = registros.alimentacao
            .filter(item => {
                const horario = new Date(item.data).getTime();
                return Number.isFinite(horario) && horario <= agora && Number(item.valor) > 0;
            })
            .sort((a, b) => new Date(b.data) - new Date(a.data));

        const ultimaRefeicao = refeicoes[0];

        if (!ultimaRefeicao) continue;

        const horarioUltima = new Date(ultimaRefeicao.data).getTime();
        const proximaRefeicao = horarioUltima + intervalo * 3600000;

        if (agora < proximaRefeicao) continue;

        const horario = new Date(proximaRefeicao).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        });

        await adicionarNotificacao({
            id: `alimentacao_${pet.id_pet}_${ultimaRefeicao.id}_${intervalo}`,
            tipo: "alimentacao",
            titulo: "Hora da refeição! 🍽️",
            mensagem: `O horário estimado da próxima refeição de ${pet.nome} era ${horario}.`
        }, db);
    }
}
