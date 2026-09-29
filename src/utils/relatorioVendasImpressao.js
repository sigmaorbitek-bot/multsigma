function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor) || 0);
}

function formatarData(data) {
  if (!data) {
    return "—";
  }

  return new Intl.DateTimeFormat("pt-BR").format(new Date(data));
}

function formatarDataHora(data) {
  if (!data) {
    return "—";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(data));
}

function formatarPagamento(tipo) {
  const nomes = {
    dinheiro: "Dinheiro",
    pix: "Pix",
    debito: "Débito",
    credito: "Crédito",
    transferencia: "Transferência",
    outro: "Outro",
  };

  return nomes[tipo] || tipo || "—";
}

export function gerarRelatorioVendasImpressao({
  empresa,
  relatorio,
  periodo,
}) {
  if (!relatorio || !periodo) {
    return;
  }

  const nomeEmpresa =
    empresa?.nome_fantasia ||
    empresa?.nome ||
    "Empresa";

  const resumo =
    relatorio.resumo ?? {};

  const pagamentos =
    Array.isArray(relatorio.pagamentos)
      ? relatorio.pagamentos
      : [];

  const produtos =
    Array.isArray(relatorio.produtos)
      ? relatorio.produtos
      : [];

  const diario =
    Array.isArray(relatorio.diario)
      ? relatorio.diario
      : [];

  const pagamentosHtml =
    pagamentos.length > 0
      ? pagamentos
          .map(
            (pagamento) => `
              <tr>
                <td>${escaparHtml(formatarPagamento(pagamento.tipo))}</td>
                <td class="numero">${Number(pagamento.quantidade) || 0}</td>
                <td class="numero forte">${formatarMoeda(pagamento.total)}</td>
              </tr>
            `,
          )
          .join("")
      : `
          <tr>
            <td colspan="3" class="vazio">Nenhum pagamento no período.</td>
          </tr>
        `;

  const produtosHtml =
    produtos.length > 0
      ? produtos
          .map(
            (produto, index) => `
              <tr>
                <td class="posicao">${index + 1}</td>
                <td>${escaparHtml(produto.produto_nome)}</td>
                <td class="numero">${Number(produto.quantidade) || 0}</td>
                <td class="numero forte">${formatarMoeda(produto.faturamento)}</td>
              </tr>
            `,
          )
          .join("")
      : `
          <tr>
            <td colspan="4" class="vazio">Nenhum produto vendido no período.</td>
          </tr>
        `;

  const diarioHtml =
    diario.length > 0
      ? diario
          .map(
            (dia) => `
              <tr>
                <td>${escaparHtml(formatarData(`${dia.data}T12:00:00`))}</td>
                <td class="numero">${Number(dia.vendas) || 0}</td>
                <td class="numero forte">${formatarMoeda(dia.faturamento)}</td>
                <td class="numero">${formatarMoeda(dia.lucro)}</td>
                <td class="numero">${formatarMoeda(dia.ticket_medio)}</td>
              </tr>
            `,
          )
          .join("")
      : `
          <tr>
            <td colspan="5" class="vazio">Nenhuma venda concluída no período.</td>
          </tr>
        `;

  const janela = window.open(
    "",
    "_blank",
    "width=900,height=900",
  );

  if (!janela) {
    window.alert(
      "O navegador bloqueou a abertura do relatório. Permita pop-ups para imprimir.",
    );

    return;
  }

  janela.document.write(`
    <!DOCTYPE html>

    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />

        <title>Relatório de vendas</title>

        <style>
          * {
            box-sizing: border-box;
          }

          @page {
            size: A4;
            margin: 14mm;
          }

          body {
            margin: 0;
            padding: 24px;

            background: #f3f4f6;
            color: #111827;

            font-family:
              Arial,
              Helvetica,
              sans-serif;

            font-size: 12px;
          }

          .folha {
            width: 100%;
            max-width: 820px;

            margin: 0 auto;
            padding: 28px;

            background: #ffffff;

            border: 1px solid #e5e7eb;
            border-radius: 12px;

            box-shadow:
              0 12px 30px rgba(15, 23, 42, 0.08);
          }

          .topo {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;

            gap: 24px;

            padding-bottom: 18px;

            border-bottom: 2px solid #111827;
          }

          .topo h1 {
            margin: 0;

            font-size: 22px;
            line-height: 1.2;
          }

          .topo p {
            margin: 5px 0 0;

            color: #4b5563;
          }

          .topo-meta {
            min-width: 220px;

            text-align: right;
          }

          .topo-meta strong {
            display: block;

            margin-bottom: 4px;

            font-size: 13px;
          }

          .topo-meta span {
            display: block;

            color: #6b7280;

            font-size: 11px;
            line-height: 1.5;
          }

          .titulo-documento {
            margin: 20px 0 6px;

            font-size: 18px;
            font-weight: 800;

            text-align: center;
          }

          .periodo {
            margin-bottom: 22px;

            color: #4b5563;

            text-align: center;
          }

          .metricas {
            display: grid;
            grid-template-columns: repeat(4, 1fr);

            gap: 10px;

            margin-bottom: 24px;
          }

          .metrica {
            padding: 13px;

            border: 1px solid #d1d5db;
            border-radius: 8px;

            background: #f9fafb;
          }

          .metrica span {
            display: block;

            margin-bottom: 5px;

            color: #6b7280;

            font-size: 10px;
            font-weight: 700;

            text-transform: uppercase;
          }

          .metrica strong {
            display: block;

            font-size: 18px;
          }

          .secao {
            margin-top: 24px;
          }

          .secao-titulo {
            margin: 0 0 10px;

            font-size: 14px;
            font-weight: 800;
          }

          table {
            width: 100%;

            border-collapse: collapse;
          }

          th,
          td {
            padding: 9px 10px;

            border-bottom: 1px solid #e5e7eb;

            text-align: left;
          }

          th {
            background: #f3f4f6;
            color: #4b5563;

            font-size: 9px;
            font-weight: 800;

            letter-spacing: 0.04em;
            text-transform: uppercase;
          }

          .numero {
            text-align: right;
            white-space: nowrap;
          }

          .forte {
            font-weight: 800;
          }

          .posicao {
            width: 42px;

            font-weight: 800;

            text-align: center;
          }

          .vazio {
            padding: 18px;

            color: #6b7280;

            text-align: center;
          }

          .rodape {
            margin-top: 28px;
            padding-top: 14px;

            border-top: 1px dashed #9ca3af;

            color: #6b7280;

            font-size: 10px;
            line-height: 1.5;

            text-align: center;
          }

          .acoes {
            display: flex;
            justify-content: flex-end;

            gap: 10px;

            max-width: 820px;

            margin: 14px auto 0;
          }

          .acoes button {
            min-width: 130px;

            padding: 10px 14px;

            border: 1px solid #d1d5db;
            border-radius: 8px;

            background: #ffffff;
            color: #111827;

            font: inherit;
            font-weight: 700;

            cursor: pointer;
          }

          .acoes .imprimir {
            border-color: #1677ff;

            background: #1677ff;
            color: #ffffff;
          }

          @media print {
            body {
              padding: 0;

              background: #ffffff;
            }

            .folha {
              max-width: none;

              padding: 0;

              border: 0;
              border-radius: 0;

              box-shadow: none;
            }

            .acoes {
              display: none;
            }

            .secao {
              break-inside: avoid;
            }
          }
        </style>
      </head>

      <body>
        <main class="folha">
          <header class="topo">
            <div>
              <h1>
                ${escaparHtml(nomeEmpresa)}
              </h1>

              <p>
                Multsigma
              </p>
            </div>

            <div class="topo-meta">
              <strong>
                Relatório de vendas
              </strong>

              <span>
                Emitido em ${escaparHtml(formatarDataHora(new Date()))}
              </span>
            </div>
          </header>

          <div class="titulo-documento">
            RELATÓRIO DE VENDAS
          </div>

          <div class="periodo">
            Período:
            ${escaparHtml(formatarData(periodo.inicio))}
            a
            ${escaparHtml(formatarData(periodo.fim))}
          </div>

          <section class="metricas">
            <div class="metrica">
              <span>Faturamento</span>

              <strong>
                ${formatarMoeda(resumo.faturamento)}
              </strong>
            </div>

            <div class="metrica">
              <span>Vendas</span>

              <strong>
                ${Number(resumo.vendas) || 0}
              </strong>
            </div>

            <div class="metrica">
              <span>Lucro</span>

              <strong>
                ${formatarMoeda(resumo.lucro)}
              </strong>
            </div>

            <div class="metrica">
              <span>Ticket médio</span>

              <strong>
                ${formatarMoeda(resumo.ticket_medio)}
              </strong>
            </div>
          </section>

          <section class="secao">
            <h2 class="secao-titulo">
              Formas de pagamento
            </h2>

            <table>
              <thead>
                <tr>
                  <th>Forma</th>
                  <th class="numero">Quantidade</th>
                  <th class="numero">Total</th>
                </tr>
              </thead>

              <tbody>
                ${pagamentosHtml}
              </tbody>
            </table>
          </section>

          <section class="secao">
            <h2 class="secao-titulo">
              Produtos mais vendidos
            </h2>

            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Produto</th>
                  <th class="numero">Quantidade</th>
                  <th class="numero">Faturamento</th>
                </tr>
              </thead>

              <tbody>
                ${produtosHtml}
              </tbody>
            </table>
          </section>

          <section class="secao">
            <h2 class="secao-titulo">
              Resumo diário
            </h2>

            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th class="numero">Vendas</th>
                  <th class="numero">Faturamento</th>
                  <th class="numero">Lucro</th>
                  <th class="numero">Ticket médio</th>
                </tr>
              </thead>

              <tbody>
                ${diarioHtml}
              </tbody>
            </table>
          </section>

          <footer class="rodape">
            Relatório gerado pelo Multsigma.

            <br />

            Desenvolvido por Sigma Orbitek.
          </footer>
        </main>

        <div class="acoes">
          <button
            type="button"
            onclick="window.close()"
          >
            Fechar
          </button>

          <button
            type="button"
            class="imprimir"
            onclick="window.print()"
          >
            Imprimir
          </button>
        </div>
      </body>
    </html>
  `);

  janela.document.close();
}
