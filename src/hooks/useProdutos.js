import { useCallback, useEffect, useState } from "react";

import { listarCategorias } from "../services/categorias";
import { listarProdutos } from "../services/produtos";

async function buscarDados(empresaId) {
  const [produtosData, categoriasData] = await Promise.all([
    listarProdutos(empresaId),
    listarCategorias(empresaId),
  ]);

  return {
    produtos: produtosData,
    categorias: categoriasData,
  };
}

export function useProdutos(empresaId) {
  const [produtos, setProdutos] = useState([]);

  const [categorias, setCategorias] = useState([]);

  const [empresaDadosId, setEmpresaDadosId] = useState(null);

  const [empresaConsultadaId, setEmpresaConsultadaId] = useState(null);

  const [recarregando, setRecarregando] = useState(false);

  const [erro, setErro] = useState("");

  const carregarDados = useCallback(async () => {
    if (!empresaId) {
      return;
    }

    setRecarregando(true);
    setErro("");

    try {
      const dados = await buscarDados(empresaId);

      setProdutos(dados.produtos);

      setCategorias(dados.categorias);

      setEmpresaDadosId(empresaId);

      setEmpresaConsultadaId(empresaId);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);

      setErro("Não foi possível carregar os produtos.");

      setEmpresaConsultadaId(empresaId);
    } finally {
      setRecarregando(false);
    }
  }, [empresaId]);

  useEffect(() => {
    if (!empresaId) {
      return;
    }

    let cancelado = false;

    buscarDados(empresaId)
      .then((dados) => {
        if (cancelado) {
          return;
        }

        setProdutos(dados.produtos);

        setCategorias(dados.categorias);

        setEmpresaDadosId(empresaId);

        setErro("");
      })
      .catch((error) => {
        if (cancelado) {
          return;
        }

        console.error("Erro ao carregar produtos:", error);

        setErro("Não foi possível carregar os produtos.");
      })
      .finally(() => {
        if (cancelado) {
          return;
        }

        setEmpresaConsultadaId(empresaId);
      });

    return () => {
      cancelado = true;
    };
  }, [empresaId]);

  const dadosSaoDaEmpresaAtual =
    Boolean(empresaId) && empresaDadosId === empresaId;

  const consultaDaEmpresaTerminou =
    Boolean(empresaId) && empresaConsultadaId === empresaId;

  const loading =
    Boolean(empresaId) && (!consultaDaEmpresaTerminou || recarregando);

  return {
    produtos: dadosSaoDaEmpresaAtual ? produtos : [],

    categorias: dadosSaoDaEmpresaAtual ? categorias : [],

    loading,

    erro: empresaId ? erro : "",

    carregarDados,
  };
}
