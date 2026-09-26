import { supabase } from "./supabase";

const BUCKET_PRODUTOS = "produtos";

const TAMANHO_MAXIMO = 5 * 1024 * 1024;

const TIPOS_PERMITIDOS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function gerarIdentificadorArquivo() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function validarImagemProduto(arquivo) {
  if (!arquivo) {
    throw new Error("Nenhuma imagem foi selecionada.");
  }

  if (!TIPOS_PERMITIDOS[arquivo.type]) {
    throw new Error("A imagem deve ser JPG, PNG ou WEBP.");
  }

  if (arquivo.size > TAMANHO_MAXIMO) {
    throw new Error("A imagem deve ter no máximo 5 MB.");
  }
}

function obterExtensao(arquivo) {
  return TIPOS_PERMITIDOS[arquivo?.type] ?? null;
}

export async function enviarImagemProduto({ empresaId, arquivo }) {
  if (!empresaId) {
    throw new Error("Empresa inválida para envio da imagem.");
  }

  validarImagemProduto(arquivo);

  const extensao = obterExtensao(arquivo);

  if (!extensao) {
    throw new Error("Formato de imagem inválido.");
  }

  const identificador = gerarIdentificadorArquivo();

  const caminho = `${empresaId}/${identificador}/produto.${extensao}`;

  const { error } = await supabase.storage
    .from(BUCKET_PRODUTOS)
    .upload(caminho, arquivo, {
      cacheControl: "3600",
      upsert: false,
      contentType: arquivo.type,
    });

  if (error) {
    throw error;
  }

  return caminho;
}

export async function removerImagemProduto(caminho) {
  if (!caminho) {
    return;
  }

  const { error } = await supabase.storage
    .from(BUCKET_PRODUTOS)
    .remove([caminho]);

  if (error) {
    throw error;
  }
}

export function obterUrlImagemProduto(caminho) {
  if (!caminho) {
    return null;
  }

  const { data } = supabase.storage.from(BUCKET_PRODUTOS).getPublicUrl(caminho);

  return data?.publicUrl ?? null;
}
