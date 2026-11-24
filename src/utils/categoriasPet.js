export function categoriaPermitida(especie, categoria) {
    const animal = (especie || '').trim().toLowerCase();

    const restricoes = {
        'peixe': ['agua', 'peso', 'vacinas'],
        'hamster': ['vacinas'],
        'porquinho-da-índia': ['vacinas'],
        'tartaruga': ['vacinas'],
        'calopsita': ['vacinas'],
        'periquito': ['vacinas'],
        'canário': ['vacinas'],
        'papagaio': ['vacinas'],
        'outro tipo de pássaro': ['vacinas'],
    };

    return !(restricoes[animal] || []).includes(categoria);
}