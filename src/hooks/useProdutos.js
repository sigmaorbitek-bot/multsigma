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

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const carregarDados = useCallback(async () => {
    if (!empresaId) {
      return;
    }

    setLoading(true);
    setErro("");

    try {
      const dados = await buscarDados(empresaId);

      setProdutos(dados.produtos);
      setCategorias(dados.categorias);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);

      setErro("Não foi possível carregar os produtos.");
    } finally {
      setLoading(false);
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
        if (!cancelado) {
          setLoading(false);
        }
      });

    return () => {
      cancelado = true;
    };
  }, [empresaId]);

  return {
    produtos,
    categorias,

    loading,
    erro,

    carregarDados,
  };
}
