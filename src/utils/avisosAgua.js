import { listarPets, listarRegistros, obterIntervaloAgua } from "../database/Database";
import { adicionarNotificacao } from "./notificacoesStorage";

export async function verificarAvisosAgua(db) {
    const pets = await listarPets(db);
    const agora = Date.now();

    for (const pet of pets) {
        const intervaloSalvo = await obterIntervaloAgua(db, pet.id_pet);
        const intervalo = Number(intervaloSalvo);

        if (!intervaloSalvo || !Number.isInteger(intervalo) || intervalo < 1 || intervalo > 24) {
            continue;
        }

        const registros = await listarRegistros(db, pet.id_pet);

        const aguas = registros.agua
            .filter(item => {
                const horario = new Date(item.data).getTime();
                return Number.isFinite(horario) && horario <= agora && Number(item.valor) > 0;
            })
            .sort((a, b) => new Date(b.data) - new Date(a.data));

        const ultimaAgua = aguas[0];

        if (!ultimaAgua) continue;

        const horarioUltima = new Date(ultimaAgua.data).getTime();
        const proximaAgua = horarioUltima + intervalo * 3600000;

        if (agora < proximaAgua) continue;

        const horario = new Date(proximaAgua).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        });

        await adicionarNotificacao({
            id: `agua_${pet.id_pet}_${ultimaAgua.id}_${intervalo}`,
            tipo: "agua",
            titulo: "Hora de renovar a água! 💧",
            mensagem: `Lembre-se de verificar e renovar a água de ${pet.nome}. Horário previsto: ${horario}.`
        }, db);
    }
}