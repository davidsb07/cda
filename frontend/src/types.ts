export type Property = {
  id: number;
  titulo: string | null;
  finalidade: string;
  num_bloco: string | null;
  num_inscricao: string | null;
  cod_endloc_logradouro: string | null;
  nme_endloc_logradouro: string | null;
  num_endloc_endereco: string | null;
  num_endloc_unidade: string | null;
  nme_endloc_bairro_cdl: string | null;
  rh_nome: string | null;
  rh_valor: number | null;
  coord_x: number | null;
  coord_y: number | null;
  ano_exercicio: number | null;
  num_versao: number | null;
  idf_reg_regiao_homogenea: number | null;
  area_total_detalhe: string | null;
  area_total: number | null;
  area_privativa_detalhe: string | null;
  area_privativa: number | null;
  finalidade_oferta: string | null;
  area_total_oferta: number | null;
  area_privativa_oferta: number | null;
  valor_oferta: number | null;
  latitude: number | null;
  longitude: number | null;
  descricao_oferta: string | null;
  observacao: string | null;
  url: string | null;
  imobiliaria: string | null;
  codigo: string | null;
  infra: string | null;
  padrao: string | null;
  conservacao: string | null;
  vaga: string | null;
  origem: string;
};

export type PropertyDraft = Omit<Property, "id">;

export type SpreadsheetPreview = {
  file_name: string;
  columns: string[];
  rows: Record<string, unknown>[];
  total_rows: number;
};

export type CadastroBaseRecord = {
  num_bloco: string | null;
  num_inscricao: string;
  cod_endloc_logradouro: string | null;
  nme_endloc_logradouro: string | null;
  num_endloc_endereco: string | null;
  num_endloc_unidade: string | null;
  nme_endloc_bairro_cdl: string | null;
  des_finalidade: string | null;
  rh_nome: string | null;
  rh_valor: number | null;
  coord_x: number | null;
  coord_y: number | null;
  ano_exercicio: number | null;
  num_versao: number | null;
  idf_reg_regiao_homogenea: number | null;
  area_territorial: number | null;
  area_construida: number | null;
  latitude: number | null;
  longitude: number | null;
  titulo_sugerido: string;
  display_label: string;
};

export type CadastroBaseSearchResponse = {
  mode: string;
  total: number;
  items: CadastroBaseRecord[];
};
