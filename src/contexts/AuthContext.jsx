import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { supabase } from "../services/supabase";
import { AuthContext } from "./auth-context";

function criarChaveEmpresaAtual(usuarioId) {
  return `multsigma_empresa_atual_${usuarioId}`;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const [session, setSession] = useState(null);

  const [vinculos, setVinculos] = useState([]);

  const [empresaAtual, setEmpresaAtual] = useState(null);

  const [vinculoAtual, setVinculoAtual] = useState(null);

  const [loading, setLoading] = useState(true);

  const usuarioAtualIdRef = useRef(null);

  const empresas = useMemo(() => {
    return vinculos.map((vinculo) => ({
      ...vinculo.empresa,

      vinculo: {
        id: vinculo.id,

        nome: vinculo.nome,

        cargo: vinculo.cargo,

        empresa_id: vinculo.empresa_id,
      },
    }));
  }, [vinculos]);

  const quantidadeEmpresas = vinculos.length;

  const temEmpresa = quantidadeEmpresas > 0;

  const precisaCadastrarEmpresa = Boolean(user) && quantidadeEmpresas === 0;

  const precisaSelecionarEmpresa =
    Boolean(user) && quantidadeEmpresas > 1 && !empresaAtual;

  const limparDadosEmpresa = useCallback(() => {
    setVinculos([]);
    setEmpresaAtual(null);
    setVinculoAtual(null);
  }, []);

  const carregarEmpresas = useCallback(
    async (usuarioId, empresaPreferidaId = null) => {
      if (!usuarioId) {
        limparDadosEmpresa();

        return [];
      }

      const { data, error } = await supabase
        .from("usuarios_empresa")
        .select(
          `
              id,
              nome,
              cargo,
              empresa_id,
              ativo,
              empresas (
                id,
                nome,
                nome_fantasia,
                slug,
                logo_path,
                ativo
              )
            `,
        )
        .eq("usuario_id", usuarioId)
        .eq("ativo", true);

      if (error) {
        console.error("Erro ao carregar empresas:", error);

        limparDadosEmpresa();

        throw error;
      }

      const vinculosValidos = (data ?? [])
        .filter((item) => item.empresas && item.empresas.ativo === true)
        .map((item) => ({
          id: item.id,

          nome: item.nome,

          cargo: item.cargo,

          empresa_id: item.empresa_id,

          ativo: item.ativo,

          empresa: item.empresas,
        }));

      setVinculos(vinculosValidos);

      if (vinculosValidos.length === 0) {
        setEmpresaAtual(null);
        setVinculoAtual(null);

        localStorage.removeItem(criarChaveEmpresaAtual(usuarioId));

        return vinculosValidos;
      }

      const empresaSalvaId = localStorage.getItem(
        criarChaveEmpresaAtual(usuarioId),
      );

      const empresaDesejadaId = empresaPreferidaId || empresaSalvaId;

      let vinculoSelecionado = null;

      if (empresaDesejadaId) {
        vinculoSelecionado =
          vinculosValidos.find(
            (item) => item.empresa_id === empresaDesejadaId,
          ) ?? null;
      }

      if (!vinculoSelecionado && vinculosValidos.length === 1) {
        vinculoSelecionado = vinculosValidos[0];
      }

      if (vinculoSelecionado) {
        setVinculoAtual(vinculoSelecionado);

        setEmpresaAtual(vinculoSelecionado.empresa);

        localStorage.setItem(
          criarChaveEmpresaAtual(usuarioId),
          vinculoSelecionado.empresa_id,
        );
      } else {
        setVinculoAtual(null);
        setEmpresaAtual(null);

        localStorage.removeItem(criarChaveEmpresaAtual(usuarioId));
      }

      return vinculosValidos;
    },
    [limparDadosEmpresa],
  );

  const selecionarEmpresa = useCallback(
    (empresaId) => {
      if (!user) {
        throw new Error("Usuário não autenticado.");
      }

      if (!empresaId) {
        throw new Error("Empresa não informada.");
      }

      const vinculo = vinculos.find((item) => item.empresa_id === empresaId);

      if (!vinculo) {
        throw new Error("Você não possui acesso a esta empresa.");
      }

      setVinculoAtual(vinculo);

      setEmpresaAtual(vinculo.empresa);

      localStorage.setItem(criarChaveEmpresaAtual(user.id), vinculo.empresa_id);

      return vinculo.empresa;
    },
    [user, vinculos],
  );

  const limparEmpresaAtual = useCallback(() => {
    if (user) {
      localStorage.removeItem(criarChaveEmpresaAtual(user.id));
    }

    setEmpresaAtual(null);
    setVinculoAtual(null);
  }, [user]);

  const recarregarEmpresas = useCallback(
    async (empresaPreferidaId = null) => {
      if (!user) {
        limparDadosEmpresa();

        return [];
      }

      return carregarEmpresas(user.id, empresaPreferidaId);
    },
    [user, carregarEmpresas, limparDadosEmpresa],
  );

  useEffect(() => {
    let ativo = true;

    async function carregarSessaoInicial() {
      try {
        const {
          data: { session: sessaoAtual },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (!ativo) {
          return;
        }

        const usuario = sessaoAtual?.user ?? null;

        usuarioAtualIdRef.current = usuario?.id ?? null;

        setSession(sessaoAtual);

        setUser(usuario);

        if (usuario) {
          await carregarEmpresas(usuario.id);
        } else {
          limparDadosEmpresa();
        }
      } catch (error) {
        console.error("Erro ao carregar sessão:", error);

        if (!ativo) {
          return;
        }

        usuarioAtualIdRef.current = null;

        setSession(null);
        setUser(null);

        limparDadosEmpresa();
      } finally {
        if (ativo) {
          setLoading(false);
        }
      }
    }

    carregarSessaoInicial();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, novaSessao) => {
      if (!ativo) {
        return;
      }

      if (event === "INITIAL_SESSION") {
        return;
      }

      const usuario = novaSessao?.user ?? null;

      const usuarioAnteriorId = usuarioAtualIdRef.current;

      usuarioAtualIdRef.current = usuario?.id ?? null;

      setSession(novaSessao);

      setUser(usuario);

      if (!usuario) {
        limparDadosEmpresa();

        setLoading(false);

        return;
      }

      if (event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        return;
      }

      if (event === "SIGNED_IN" && usuarioAnteriorId === usuario.id) {
        return;
      }

      setLoading(true);

      setTimeout(() => {
        if (!ativo) {
          return;
        }

        carregarEmpresas(usuario.id)
          .catch((error) => {
            console.error("Erro ao atualizar empresas:", error);
          })
          .finally(() => {
            if (ativo) {
              setLoading(false);
            }
          });
      }, 0);
    });

    return () => {
      ativo = false;

      subscription.unsubscribe();
    };
  }, [carregarEmpresas, limparDadosEmpresa]);

  async function entrar(email, senha) {
    const emailLimpo = email?.trim();

    if (!emailLimpo) {
      throw new Error("Informe o e-mail.");
    }

    if (!senha) {
      throw new Error("Informe a senha.");
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailLimpo,

      password: senha,
    });

    if (error) {
      throw error;
    }

    return data;
  }

  async function sair() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    usuarioAtualIdRef.current = null;

    setSession(null);
    setUser(null);

    limparDadosEmpresa();
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,

        empresas,
        vinculos,

        empresaAtual,
        vinculoAtual,

        empresa: empresaAtual,

        vinculo: vinculoAtual,

        quantidadeEmpresas,
        temEmpresa,

        precisaCadastrarEmpresa,
        precisaSelecionarEmpresa,

        loading,

        entrar,
        sair,

        selecionarEmpresa,
        limparEmpresaAtual,
        recarregarEmpresas,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
