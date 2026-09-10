/**
 * Utilitário profissional para exportar arrays de objetos para arquivo CSV
 * com suporte a acentuação UTF-8 (BOM para compatibilidade com Microsoft Excel).
 * Suporta formatos flexíveis de colunas e parâmetros.
 */
export function exportToCSV(data, arg2, arg3) {
    if (!data || data.length === 0) {
        alert('Não há dados para exportar com os filtros atuais.');
        return;
    }

    let filename = 'relatorio.csv';
    let columns = null;

    if (typeof arg2 === 'string') {
        filename = arg2;
        columns = arg3 || null;
    } else if (Array.isArray(arg2)) {
        columns = arg2;
        filename = typeof arg3 === 'string' ? arg3 : 'relatorio.csv';
    }

    if (!filename.toLowerCase().endsWith('.csv')) {
        filename += '.csv';
    }

    const headers = [];
    const extractors = [];

    if (columns && columns.length > 0) {
        columns.forEach(col => {
            const label = col.label || col.header || col.name || col.title || col.key || 'Coluna';
            headers.push(label);

            if (typeof col.accessor === 'function') {
                extractors.push(col.accessor);
            } else if (typeof col.format === 'function') {
                const key = col.key || col.id;
                extractors.push((item) => col.format(item[key], item));
            } else {
                const key = col.key || col.id || col.accessor;
                extractors.push((item) => item[key]);
            }
        });
    } else {
        const keys = Object.keys(data[0]);
        keys.forEach(k => {
            headers.push(k);
            extractors.push((item) => item[k]);
        });
    }

    const csvRows = [];
    // Cabeçalho
    csvRows.push(headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(';'));

    // Dados
    for (const item of data) {
        const values = extractors.map(fn => {
            let val = fn(item);
            if (val === undefined || val === null) val = '';
            if (typeof val === 'number') {
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
