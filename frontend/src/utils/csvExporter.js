/**
 * Utilitário para exportar arrays de objetos para arquivo CSV
 * com suporte a acentuação UTF-8 (BOM para compatibilidade com Microsoft Excel).
 */
export function exportToCSV(data, filename = 'relatorio.csv', columns = null) {
    if (!data || data.length === 0) {
        alert('Não há dados para exportar com os filtros atuais.');
        return;
    }

    const headers = columns ? columns.map(c => c.label) : Object.keys(data[0]);
    const keys = columns ? columns.map(c => c.key) : Object.keys(data[0]);

    const csvRows = [];
    // Linha de cabeçalho
    csvRows.push(headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(';'));

    // Linhas de dados
    for (const item of data) {
        const values = keys.map(key => {
            let val = item[key];
            if (val === undefined || val === null) val = '';
            if (typeof val === 'number') {
                // Formata número com vírgula para pt-BR
                val = val.toFixed(2).replace('.', ',');
            }
            return `"${String(val).replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(';'));
    }

    const csvContent = '\uFEFF' + csvRows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
