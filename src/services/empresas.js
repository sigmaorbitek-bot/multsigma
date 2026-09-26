import { supabase } from "./supabase";

const BUCKET_LOGOS = "logos-empresas";

const TIPOS_LOGO_PERMITIDOS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function obterExtensaoLogo(arquivo) {
  return TIPOS_LOGO_PERMITIDOS[arquivo?.type] ?? null;
}

function gerarIdentificadorArquivo() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function criarEmpresaUsuario({ nomeEmpresa, nomeResponsavel }) {
  const nomeEmpresaLimpo = nomeEmpresa?.trim();

  const nomeResponsavelLimpo = nomeResponsavel?.trim();

  if (!nomeEmpresaLimpo) {
    throw new Error("Informe o nome da empresa.");
  }

  if (!nomeResponsavelLimpo) {
    throw new Error("Informe o nome do responsável.");
  }

  if (nomeEmpresaLimpo.length > 120) {
    throw new Error("O nome da empresa deve possuir no máximo 120 caracteres.");
  }

  if (nomeResponsavelLimpo.length > 120) {
    throw new Error(
      "O nome do responsável deve possuir no máximo 120 caracteres.",
    );
  }

  const { data, error } = await supabase.rpc("criar_empresa_usuario", {
    p_nome_empresa: nomeEmpresaLimpo,

    p_nome_responsavel: nomeResponsavelLimpo,
  });

  if (error) {
    throw error;
  }

  const empresaCriada = Array.isArray(data) ? data[0] : data;

  if (!empresaCriada?.empresa_id) {
    throw new Error(
      "A empresa foi criada, mas o banco não retornou o identificador.",
    );
  }

  return empresaCriada;
}

export async function atualizarLogoEmpresa({ empresaId, logoPath }) {
  if (!empresaId) {
    throw new Error("Empresa inválida para atualização da logo.");
  }

  const logoPathNormalizado =
    logoPath === null || logoPath === undefined
      ? null
      : String(logoPath).trim();

  if (logoPathNormalizado !== null && !logoPathNormalizado) {
    throw new Error("Caminho da logo inválido.");
  }

  const { error } = await supabase.rpc("atualizar_logo_empresa", {
    p_empresa_id: empresaId,

    p_logo_path: logoPathNormalizado,
  });

  if (error) {
    throw error;
  }
}

export async function enviarLogoEmpresa({ empresaId, arquivo }) {
  if (!empresaId) {
    throw new Error("Empresa inválida para envio da logo.");
  }

  if (!arquivo) {
    throw new Error("Nenhuma imagem foi selecionada.");
  }

  const extensao = obterExtensaoLogo(arquivo);

  if (!extensao) {
    throw new Error("Formato de imagem não permitido.");
  }

  const identificador = gerarIdentificadorArquivo();

  const caminho = `${empresaId}/logo-${identificador}.${extensao}`;

  const { error: erroUpload } = await supabase.storage
    .from(BUCKET_LOGOS)
    .upload(caminho, arquivo, {
      cacheControl: "3600",
      upsert: false,
      contentType: arquivo.type,
    });

  if (erroUpload) {
    throw erroUpload;
  }

  try {
    await atualizarLogoEmpresa({
      empresaId,
      logoPath: caminho,
    });
  } catch (error) {
    const { error: erroRemocao } = await supabase.storage
      .from(BUCKET_LOGOS)
      .remove([caminho]);

    if (erroRemocao) {
      console.error("Não foi possível remover a logo após falha:", erroRemocao);
    }

    throw error;
  }

  return caminho;
}
