/**
 * Utilitário profissional para geração e impressão de relatórios em formato PDF / A4
 * com cabeçalho institucional Fazenda GD, métricas resumidas, tabelas formatadas e rodapé.
 */

export function printReport({
    title = 'Relatório Agropecuário',
    subtitle = 'Fazenda GD - Gestão Integrada',
    summaryCards = [],
    columns = [],
    data = [],
    notes = ''
}) {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
        alert('Por favor, permita pop-ups para gerar a impressão do relatório em PDF.');
        return;
    }

    const now = new Date();
    const formattedDate = now.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const summaryHtml = summaryCards.length > 0 ? `
        <div class="summary-grid">
            ${summaryCards.map(c => `
                <div class="summary-card">
                    <div class="card-label">${c.label}</div>
                    <div class="card-value ${c.colorClass || ''}">${c.value}</div>
                </div>
            `).join('')}
        </div>
    ` : '';

    const tableHeadersHtml = columns.map(c => `<th style="${c.align ? `text-align: ${c.align};` : ''}">${c.label}</th>`).join('');

    const tableRowsHtml = data.map((row, idx) => {
        const cells = columns.map(c => {
            let val = row[c.key];
            if (val === undefined || val === null || val === '') val = '-';
            if (c.format && typeof c.format === 'function') {
                val = c.format(val, row);
            }
            return `<td style="${c.align ? `text-align: ${c.align};` : ''}">${val}</td>`;
        }).join('');
        return `<tr>${cells}</tr>`;
    }).join('');

    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>${title} - Fazenda GD</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 15mm 12mm 15mm 12mm;
        }
        * {
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b;
        }
        body {
            margin: 0;
            padding: 20px;
            background: #ffffff;
            font-size: 11pt;
            line-height: 1.4;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #16a34a;
            padding-bottom: 12px;
            margin-bottom: 16px;
        }
        .header-brand {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .header-logo {
            font-size: 24pt;
            line-height: 1;
        }
        .header-title {
            font-size: 16pt;
            font-weight: 700;
            color: #0f172a;
            margin: 0;
        }
        .header-subtitle {
            font-size: 9pt;
            color: #64748b;
            margin: 2px 0 0 0;
        }
        .header-meta {
            text-align: right;
            font-size: 8.5pt;
            color: #64748b;
        }
        .report-title-box {
            background: #f8fafc;
            border-left: 4px solid #16a34a;
            padding: 8px 12px;
            margin-bottom: 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .report-title {
            font-size: 13pt;
            font-weight: 600;
            color: #0f172a;
            margin: 0;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
            gap: 10px;
            margin-bottom: 16px;
        }
        .summary-card {
            background: #f1f5f9;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 8px 10px;
        }
        .card-label {
            font-size: 8pt;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #64748b;
            font-weight: 600;
        }
        .card-value {
            font-size: 12pt;
            font-weight: 700;
            color: #0f172a;
            margin-top: 2px;
        }
        .text-green { color: #16a34a !important; }
        .text-red { color: #dc2626 !important; }
        .text-blue { color: #2563eb !important; }
        
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9pt;
            margin-bottom: 16px;
        }
        th {
            background: #f8fafc;
            color: #475569;
            font-weight: 600;
            text-align: left;
            padding: 6px 8px;
            border-top: 1px solid #cbd5e1;
            border-bottom: 1px solid #cbd5e1;
        }
        td {
            padding: 6px 8px;
            border-bottom: 1px solid #f1f5f9;
            vertical-align: middle;
        }
        tr:nth-child(even) td {
            background: #fcfdfe;
        }
        .notes-box {
            background: #fefce8;
            border: 1px solid #fef08a;
            border-radius: 4px;
            padding: 8px 12px;
            font-size: 8.5pt;
            color: #854d0e;
            margin-top: 12px;
        }
        .footer {
            margin-top: 24px;
            padding-top: 12px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            font-size: 8pt;
            color: #94a3b8;
        }
        @media print {
            body { padding: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-brand">
            <div class="header-logo">🌾</div>
            <div>
                <h1 class="header-title">FAZENDA GD</h1>
                <p class="header-subtitle">${subtitle}</p>
            </div>
        </div>
        <div class="header-meta">
            <div>Emissão: <strong>${formattedDate}</strong></div>
            <div>Sistema Integrado de Gestão Agropecuária</div>
        </div>
    </div>

    <div class="report-title-box">
        <h2 class="report-title">${title}</h2>
        <span style="font-size: 9pt; color: #64748b;">Total de registros: <strong>${data.length}</strong></span>
    </div>

    ${summaryHtml}

    <table>
        <thead>
            <tr>${tableHeadersHtml}</tr>
        </thead>
        <tbody>
            ${data.length > 0 ? tableRowsHtml : '<tr><td colspan="100%" style="text-align:center; padding: 20px; color: #94a3b8;">Nenhum registro encontrado para os filtros selecionados.</td></tr>'}
        </tbody>
    </table>

    ${notes ? `<div class="notes-box"><strong>Observações:</strong> ${notes}</div>` : ''}

    <div class="footer">
        <div>Fazenda GD &copy; ${now.getFullYear()} &bull; Relatório emitido eletronicamente</div>
        <div>Página 1 de 1</div>
    </div>

    <script>
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 300);
        };
    </script>
</body>
</html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
}
