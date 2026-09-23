import { useEffect, useState } from "react";

import { supabase } from "../services/supabase";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);

  const [empresa, setEmpresa] = useState(null);
  const [vinculo, setVinculo] = useState(null);

  const [loading, setLoading] = useState(true);

  async function carregarEmpresa(usuarioId) {
    if (!usuarioId) {
      setEmpresa(null);
      setVinculo(null);

      return;
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
      .eq("ativo", true)
      .maybeSingle();

    if (error) {
      console.error("Erro ao carregar empresa:", error);

      setEmpresa(null);
      setVinculo(null);

      return;
    }

    if (!data) {
      setEmpresa(null);
      setVinculo(null);

      return;
    }

    setVinculo({
      id: data.id,
      nome: data.nome,
      cargo: data.cargo,
      empresa_id: data.empresa_id,
    });

    setEmpresa(data.empresas);
  }

  useEffect(() => {
    let ativo = true;

    async function carregarSessao() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Erro ao carregar sessão:", error);
      }

      if (!ativo) {
        return;
      }

      setSession(session);

      const usuario = session?.user ?? null;

      setUser(usuario);

      if (usuario) {
        await carregarEmpresa(usuario.id);
      } else {
        setEmpresa(null);
        setVinculo(null);
      }

      if (ativo) {
        setLoading(false);
      }
    }

    carregarSessao();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);

      const usuario = session?.user ?? null;

      setUser(usuario);

      if (usuario) {
        await carregarEmpresa(usuario.id);
      } else {
        setEmpresa(null);
        setVinculo(null);
      }

      setLoading(false);
    });

    return () => {
      ativo = false;
      subscription.unsubscribe();
    };
  }, []);

  async function entrar(email, senha) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
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
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,

        empresa,
        vinculo,

        loading,

        entrar,
        sair,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
