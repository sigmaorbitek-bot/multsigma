function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function formatarMoedaComprovante(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor) || 0);
}

export function formatarDataComprovante(data) {
  if (!data) {
    return "—";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(data));
}

export function formatarPagamentoComprovante(tipo) {
  const nomes = {
    dinheiro: "Dinheiro",
    pix: "Pix",
    debito: "Débito",
    credito: "Crédito",
    transferencia: "Transferência",
    outro: "Outro",
    misto: "Misto",
  };

  return nomes[tipo] || tipo || "—";
}

function normalizarItens(venda) {
  if (!Array.isArray(venda?.itens)) {
    return [];
  }

  return venda.itens.map((item) => {
    const quantidade =
      Number(item.quantidade) || 0;

    const preco =
      Number(
        item.preco_unitario ??
          item.precoVenda ??
          0,
      ) || 0;

    const desconto =
      Number(item.desconto) || 0;

    const totalCalculado =
      quantidade *
        preco -
      desconto;

    return {
      nome:
        item.produto_nome ??
        item.nome ??
        "Produto",

      unidade:
        item.unidade ??
        "",

      quantidade,

      preco,

      desconto,

      total:
        Number(
          item.total,
        ) ||
        totalCalculado,
    };
  });
}

function normalizarPagamentos(venda) {
  if (
    Array.isArray(
      venda?.pagamentos,
    )
  ) {
    return venda.pagamentos.map(
      (pagamento) => ({
        tipo:
          pagamento.tipo,

        valor:
          Number(
            pagamento.valor,
          ) || 0,

        parcelas:
          Number(
            pagamento.parcelas,
          ) || 1,

        valorRecebido:
          pagamento.valor_recebido ??
          pagamento.valorRecebido ??
          null,

        troco:
          Number(
            pagamento.troco,
          ) || 0,
      }),
    );
  }

  if (venda?.pagamento) {
    return [
      {
        tipo:
          venda.pagamento
            .tipo,

        valor:
          Number(
            venda.pagamento
              .valor ??
              venda.total,
          ) || 0,

        parcelas:
          Number(
            venda.pagamento
              .parcelas,
          ) || 1,

        valorRecebido:
          venda.pagamento
            .valorRecebido ??
          venda.pagamento
            .valor_recebido ??
          null,

        troco:
          Number(
            venda.pagamento
              .troco,
          ) || 0,
      },
    ];
  }

  return [];
}

function obterVendaId(venda) {
  if (venda?.id) {
    return venda.id;
  }

  const resultado =
    venda?.resultado;

  if (
    resultado &&
    typeof resultado ===
      "object"
  ) {
    return (
      resultado.id ??
      resultado.venda_id ??
      resultado.vendaId ??
      null
    );
  }

  return null;
}

export function gerarComprovanteVenda({
  empresa,
  venda,
}) {
  if (!venda) {
    return;
  }

  const nomeEmpresa =
    empresa?.nome_fantasia ||
    empresa?.nome ||
    "Empresa";

  const itens =
    normalizarItens(venda);

  const pagamentos =
    normalizarPagamentos(
      venda,
    );

  const vendaId =
    obterVendaId(venda);

  const dataVenda =
    venda.created_at ??
    venda.finalizadaEm ??
    new Date().toISOString();

  const itensHtml =
    itens
      .map((item) => {
        return `
          <div class="item">
            <strong>
              ${escaparHtml(
                item.nome,
              )}
            </strong>

            <div class="linha">
              <span>
                ${item.quantidade}
                ${
                  item.unidade
                    ? escaparHtml(
                        item.unidade,
                      )
                    : ""
                }
                ×
                ${formatarMoedaComprovante(
                  item.preco,
                )}
              </span>

              <span>
                ${formatarMoedaComprovante(
                  item.total,
                )}
              </span>
            </div>

            ${
              item.desconto > 0
                ? `
                  <div class="detalhe">
                    Desconto:
                    ${formatarMoedaComprovante(
                      item.desconto,
                    )}
                  </div>
                `
                : ""
            }
          </div>
        `;
      })
      .join("");

  const pagamentosHtml =
    pagamentos
      .map((pagamento) => {
        return `
          <div class="pagamento-item">
            <div>
              <span>
                ${escaparHtml(
                  formatarPagamentoComprovante(
                    pagamento.tipo,
                  ),
                )}
              </span>

              <strong>
                ${formatarMoedaComprovante(
                  pagamento.valor,
                )}
              </strong>
            </div>

            ${
              pagamento.tipo ===
                "credito" &&
              pagamento.parcelas >
                1
                ? `
                  <div>
                    <span>
                      Parcelas
                    </span>

                    <strong>
                      ${pagamento.parcelas}x
                    </strong>
                  </div>
                `
                : ""
            }

            ${
              pagamento.tipo ===
                "dinheiro" &&
              pagamento.valorRecebido !==
                null &&
              pagamento.valorRecebido !==
                undefined
                ? `
                  <div>
                    <span>
                      Recebido
                    </span>

                    <strong>
                      ${formatarMoedaComprovante(
                        pagamento.valorRecebido,
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Troco
                    </span>

                    <strong>
                      ${formatarMoedaComprovante(
                        pagamento.troco,
                      )}
                    </strong>
                  </div>
                `
                : ""
            }
          </div>
        `;
      })
      .join("");

  const janela =
    window.open(
      "",
      "_blank",
      "width=420,height=720",
    );

  if (!janela) {
    window.alert(
      "O navegador bloqueou o comprovante. Permita pop-ups para imprimir.",
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

        <title>Comprovante de venda</title>

        <style>
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 24px;

            background: #ffffff;
            color: #111827;

            font-family:
              Arial,
              Helvetica,
              sans-serif;

            font-size: 13px;
          }

          .comprovante {
            width: 100%;
            max-width: 360px;

            margin: 0 auto;
          }

          .topo {
            padding-bottom: 18px;

            border-bottom:
              1px dashed #9ca3af;

            text-align: center;
          }

          .topo h1 {
            margin: 0;

            font-size: 20px;
          }

          .topo p {
            margin: 6px 0 0;

            color: #4b5563;

            font-size: 12px;
          }

          .numero {
            margin-top: 10px;

            color: #6b7280;

            font-size: 10px;

            word-break: break-all;
          }

          .titulo {
            margin-top: 18px;

            font-size: 12px;
            font-weight: 700;

            text-align: center;
          }

          .itens {
            display: flex;
            flex-direction: column;

            gap: 12px;

            margin-top: 18px;
          }

          .item {
            padding-bottom: 12px;

            border-bottom:
              1px dashed #d1d5db;
          }

          .item strong {
            display: block;

            margin-bottom: 5px;
          }

          .linha,
          .pagamento-item > div,
          .totais > div {
            display: flex;
            justify-content: space-between;

            gap: 12px;
          }

          .detalhe {
            margin-top: 4px;

            color: #6b7280;

            font-size: 11px;
          }

          .totais {
            display: flex;
            flex-direction: column;

            gap: 8px;

            margin-top: 18px;
          }

          .total {
            margin-top: 6px;
            padding-top: 10px;

            border-top:
              1px solid #111827;

            font-size: 16px;
            font-weight: 700;
          }

          .pagamentos {
            display: flex;
            flex-direction: column;

            gap: 14px;

            margin-top: 18px;
            padding-top: 18px;

            border-top:
              1px dashed #9ca3af;
          }

          .pagamento-item {
            display: flex;
            flex-direction: column;

            gap: 7px;
          }

          .observacoes,
          .rodape {
            margin-top: 20px;
            padding-top: 16px;

            border-top:
              1px dashed #9ca3af;

            color: #4b5563;

            font-size: 11px;
            line-height: 1.5;
          }

          .rodape {
            text-align: center;
          }

          .acoes {
            display: flex;

            gap: 8px;

            margin-top: 24px;
          }

          .acoes button {
            width: 100%;

            padding: 10px 12px;

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
            }

            .acoes {
              display: none;
            }
          }
        </style>
      </head>

      <body>
        <main class="comprovante">
          <div class="topo">
            <h1>
              ${escaparHtml(
                nomeEmpresa,
              )}
            </h1>

            <p>
              Comprovante de venda
            </p>

            <p>
              ${escaparHtml(
                formatarDataComprovante(
                  dataVenda,
                ),
              )}
            </p>

            ${
              vendaId
                ? `
                  <div class="numero">
                    Venda:
                    ${escaparHtml(
                      vendaId,
                    )}
                  </div>
                `
                : ""
            }
          </div>

          <div class="titulo">
            ITENS DA VENDA
          </div>

          <div class="itens">
            ${itensHtml}
          </div>

          <div class="totais">
            <div>
              <span>
                Subtotal
              </span>

              <strong>
                ${formatarMoedaComprovante(
                  venda.subtotal,
                )}
              </strong>
            </div>

            <div>
              <span>
                Desconto
              </span>

              <strong>
                - ${formatarMoedaComprovante(
                  venda.desconto,
                )}
              </strong>
            </div>

            <div>
              <span>
                Acréscimo
              </span>

              <strong>
                + ${formatarMoedaComprovante(
                  venda.acrescimo,
                )}
              </strong>
            </div>

            <div class="total">
              <span>
                Total
              </span>

              <strong>
                ${formatarMoedaComprovante(
                  venda.total,
                )}
              </strong>
            </div>
          </div>

          <div class="pagamentos">
            <div class="titulo">
              PAGAMENTO
            </div>

            ${
              pagamentosHtml ||
              `
                <div class="pagamento-item">
                  <div>
                    <span>
                      Forma
                    </span>

                    <strong>
                      ${escaparHtml(
                        formatarPagamentoComprovante(
                          venda.forma_pagamento,
                        ),
                      )}
                    </strong>
                  </div>
                </div>
              `
            }
          </div>

          ${
            venda.observacoes
              ? `
                <div class="observacoes">
                  <strong>
                    Observações
                  </strong>

                  <br />

                  ${escaparHtml(
                    venda.observacoes,
                  )}
                </div>
              `
              : ""
          }

          <div class="rodape">
            Obrigado pela preferência.

            <br />

            Comprovante não fiscal.
          </div>

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
        </main>
      </body>
    </html>
  `);

  janela.document.close();
}
