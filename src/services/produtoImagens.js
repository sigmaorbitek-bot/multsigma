import { supabase } from "./supabase";

const TAMANHO_MAXIMO = 5 * 1024 * 1024;

const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];

export function validarImagemProduto(arquivo) {
  if (!arquivo) {
    return;
  }

  if (!TIPOS_PERMITIDOS.includes(arquivo.type)) {
    throw new Error("A imagem deve ser JPG, PNG ou WEBP.");
  }

  if (arquivo.size > TAMANHO_MAXIMO) {
    throw new Error("A imagem deve ter no máximo 5 MB.");
  }
}

function obterExtensao(arquivo) {
  const extensoes = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };

  return extensoes[arquivo.type];
}

export async function enviarImagemProduto({ empresaId, arquivo }) {
  validarImagemProduto(arquivo);

  const extensao = obterExtensao(arquivo);

  const identificador = crypto.randomUUID();

  const caminho = `${empresaId}/${identificador}/produto.${extensao}`;

  const { error } = await supabase.storage
    .from("produtos")
    .upload(caminho, arquivo, {
      cacheControl: "3600",
      upsert: false,
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

  const { error } = await supabase.storage.from("produtos").remove([caminho]);

  if (error) {
    throw error;
  }
}

export function obterUrlImagemProduto(caminho) {
  if (!caminho) {
    return null;
  }

  return supabase.storage.from("produtos").getPublicUrl(caminho).data.publicUrl;
}
