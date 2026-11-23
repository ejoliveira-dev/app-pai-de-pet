
import AsyncStorage from "@react-native-async-storage/async-storage";

async function chaveNotificacoes() {
    const email = await AsyncStorage.getItem("usuarioLogado");
    if (!email) return null;

    return `notificacoes_${email.trim().toLowerCase()}`;
}

export async function listarNotificacoes() {
    const chave = await chaveNotificacoes();
    if (!chave) return [];

    const dados = await AsyncStorage.getItem(chave);
    return dados ? JSON.parse(dados) : [];
}

export async function adicionarNotificacao(notificacao) {
    const chave = await chaveNotificacoes();
    if (!chave) return;

    const lista = await listarNotificacoes();

    if (notificacao.id && lista.some(item => item.id === notificacao.id)) return;

    const nova = {
        ...notificacao,
        id: notificacao.id || `${Date.now()}_${Math.random()}`,
        data: notificacao.data || new Date().toISOString(),
        lida: false
    };

    await AsyncStorage.setItem(chave, JSON.stringify([nova, ...lista]));
}

export async function marcarNotificacaoLida(id) {
    const chave = await chaveNotificacoes();
    if (!chave) return;

    const lista = await listarNotificacoes();
    const atualizada = lista.map(item =>
        item.id === id ? { ...item, lida: true } : item
    );

    await AsyncStorage.setItem(chave, JSON.stringify(atualizada));
}

export async function marcarTodasLidas() {
    const chave = await chaveNotificacoes();
    if (!chave) return;

    const lista = await listarNotificacoes();
    const atualizada = lista.map(item => ({ ...item, lida: true }));

    await AsyncStorage.setItem(chave, JSON.stringify(atualizada));
}
