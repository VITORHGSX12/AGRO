/**
 * Utilitário para parsing e validação de arquivos CSV/planilhas para importação em lote de animais.
 */

export function parseCSVToAnimals(text) {
    if (!text || typeof text !== 'string') {
        throw new Error('Conteúdo do arquivo vazio ou inválido.');
    }

    // Identifica quebra de linha
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
        throw new Error('O arquivo precisa conter ao menos a linha de cabeçalho e uma linha de dados.');
    }

    // Detecta o delimitador (, ou ;)
    const firstLine = lines[0];
    const delimiter = (firstLine.match(/;/g) || []).length >= (firstLine.match(/,/g) || []).length ? ';' : ',';

    // Helper para limpar aspas
    const clean = val => val ? val.replace(/^["']|["']$/g, '').trim() : '';

    const headers = firstLine.split(delimiter).map(h => clean(h).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));

    // Mapa de cabeçalhos esperados
    const map = {
        brinco: headers.findIndex(h => h.includes('brinco') || h.includes('ident') || h.includes('tag')),
        sexo: headers.findIndex(h => h === 'sexo' || h.includes('genero')),
        categoria: headers.findIndex(h => h.includes('categ') || h.includes('tipo')),
        raca: headers.findIndex(h => h.includes('raca')),
        peso_atual: headers.findIndex(h => h.includes('peso')),
        data_nascimento: headers.findIndex(h => h.includes('nasc') || h.includes('data')),
        origem: headers.findIndex(h => h.includes('origem')),
        observacoes: headers.findIndex(h => h.includes('obs') || h.includes('nota'))
    };

    if (map.brinco === -1) {
        throw new Error('Coluna obrigatória "brinco" (ou "identificacao") não foi encontrada no cabeçalho.');
    }

    const results = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
        const rawLine = lines[i];
        const cols = rawLine.split(delimiter).map(clean);

        const brinco = map.brinco !== -1 ? cols[map.brinco] : '';
        if (!brinco) {
            errors.push({ line: i + 1, error: 'Brinco não informado' });
            continue;
        }

        let sexo = map.sexo !== -1 ? cols[map.sexo] : 'M';
        if (sexo) {
            const sLower = sexo.toLowerCase();
            if (sLower.startsWith('m') || sLower === 'macho') sexo = 'M';
            else if (sLower.startsWith('f') || sLower === 'femea' || sLower === 'fêmea') sexo = 'F';
            else sexo = 'M';
        } else {
            sexo = 'M';
        }

        const categoria = map.categoria !== -1 && cols[map.categoria] ? cols[map.categoria] : 'Bezerro(a)';
        const raca = map.raca !== -1 && cols[map.raca] ? cols[map.raca] : 'Nelore';
        
        let peso = 0;
        if (map.peso_atual !== -1 && cols[map.peso_atual]) {
            const cleanWeight = cols[map.peso_atual].replace(/\s*kg/gi, '').replace(',', '.');
            peso = parseFloat(cleanWeight) || 0;
        }

        const data_nasc = map.data_nascimento !== -1 && cols[map.data_nascimento] ? cols[map.data_nascimento] : new Date().toISOString().split('T')[0];
        const origem = map.origem !== -1 && cols[map.origem] ? cols[map.origem] : 'Nascido na Fazenda';
        const obs = map.observacoes !== -1 && cols[map.observacoes] ? cols[map.observacoes] : 'Importado via planilha CSV';

        results.push({
            brinco,
            sexo,
            categoria,
            raca,
            peso_atual: peso,
            data_nascimento: data_nasc,
            origem,
            observacoes: obs,
            status: 'ativo'
        });
    }

    return { results, errors, total: lines.length - 1 };
}

/**
 * Gera um modelo CSV em formato compatível com Excel para download de exemplo.
 */
export function generateSampleCSV() {
    const csvContent = "\uFEFFbrinco;sexo;categoria;raca;peso_atual;data_nascimento;origem;observacoes\r\n" +
        "BR-101;M;Bezerro;Nelore;185.5;2025-10-15;Nascido na Fazenda;Lote A\r\n" +
        "BR-102;F;Novilha;Angus;280.0;2025-05-10;Compra;Lote Cruzamento\r\n" +
        "BR-103;M;Garrote;Nelore;320.0;2025-01-20;Nascido na Fazenda;Pasto 01\r\n" +
        "BR-104;F;Vaca;Nelore;450.0;2023-08-12;Nascido na Fazenda;Matriz\r\n";
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'modelo_importacao_animais.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
