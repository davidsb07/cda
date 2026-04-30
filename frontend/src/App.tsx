import { FormEvent, useEffect, useState } from "react";
import {
  createProperty,
  deleteProperty,
  fetchProperties,
  getExportUrl,
  searchCadastroBase
} from "./api";
import type { CadastroBaseRecord, Property, PropertyDraft } from "./types";
import logoCdA from "./assets/cdA_logo_transparent.png";

const CONSERVACAO_OPTIONS = [
  {
    categoria: "Otimo",
    classes: ["A", "B"],
    explicacao: [
      "Imovel novo ou quase novo",
      "Sem danos aparentes",
      "Nao precisa de reparos",
      "Tudo funcionando normalmente",
      "Pode exigir no maximo pintura leve"
    ]
  },
  {
    categoria: "Bom",
    classes: ["C", "D"],
    explicacao: [
      "Imovel bem conservado",
      "Apresenta sinais normais de uso",
      "Pode precisar de pequenos reparos pontuais",
      "Pode ter leves fissuras ou desgaste superficial",
      "Nao compromete o uso do imovel"
    ]
  },
  {
    categoria: "Regular",
    classes: ["E"],
    explicacao: [
      "Precisa de manutencao simples mais ampla",
      "Pode necessitar pintura interna e externa",
      "Pode ter fissuras superficiais mais visiveis",
      "Pode exigir revisao hidraulica ou eletrica",
      "Continua funcional para uso"
    ]
  },
  {
    categoria: "Ruim",
    classes: ["F", "G", "H"],
    explicacao: [
      "Precisa de reparos importantes ou generalizados",
      "Pode comprometer estetica, funcionalidade ou seguranca",
      "Pode exigir troca de revestimentos, telhado ou instalacoes",
      "Pode envolver problemas estruturais",
      "Nos casos mais graves, requer reforma pesada ou quase total"
    ]
  }
] as const;

const CLASSIFICATION_GUIDES = {
  infra: {
    titulo: "Infra",
    descricao: "Espaco reservado para os criterios de infraestrutura.",
    status: "Em breve",
    blocos: [
      {
        titulo: "Sem guia ainda",
        itens: [
          "As explicacoes de classificacao de Infra serao adicionadas aqui futuramente.",
          "O campo continua disponivel para selecao manual."
        ]
      }
    ]
  },
  padrao: {
    titulo: "Padrao",
    descricao: "Espaco reservado para os criterios de padrao construtivo.",
    status: "Em breve",
    blocos: [
      {
        titulo: "Sem guia ainda",
        itens: [
          "As explicacoes de classificacao de Padrao serao adicionadas aqui futuramente.",
          "O campo continua disponivel para selecao manual."
        ]
      }
    ]
  },
  conservacao: {
    titulo: "Conservacao",
    descricao: "Leia os textos e escolha a categoria mais adequada ao estado atual do imovel.",
    status: "Disponivel",
    blocos: CONSERVACAO_OPTIONS.map((option) => ({
      titulo: `${option.categoria} | Classes ${option.classes.join(", ")}`,
      valor: option.categoria,
      itens: option.explicacao
    }))
  },
  vaga: {
    titulo: "Vaga",
    descricao: "Considere a existencia de vaga e a facilidade de estacionamento no entorno.",
    status: "Disponivel",
    blocos: [
      {
        titulo: "Sim",
        valor: "Sim",
        itens: [
          "O imovel possui vaga propria ou vaga disponivel no empreendimento."
        ]
      },
      {
        titulo: "Nao | estacionamento facilitado",
        valor: "Nao - facilidade de estacionamento",
        itens: [
          "O imovel nao possui vaga.",
          "Mesmo assim, a regiao oferece facilidade para estacionar."
        ]
      },
      {
        titulo: "Nao | estacionamento dificil",
        valor: "Nao - dificuldade de estacionamento",
        itens: [
          "O imovel nao possui vaga.",
          "Ha dificuldade de encontrar estacionamento na regiao."
        ]
      }
    ]
  }
} as const;

const initialForm: PropertyDraft = {
  titulo: null,
  finalidade: "RESIDENCIAL",
  num_bloco: null,
  num_inscricao: null,
  cod_endloc_logradouro: null,
  nme_endloc_logradouro: null,
  num_endloc_endereco: null,
  num_endloc_unidade: null,
  nme_endloc_bairro_cdl: null,
  rh_nome: null,
  rh_valor: null,
  coord_x: null,
  coord_y: null,
  ano_exercicio: null,
  num_versao: null,
  idf_reg_regiao_homogenea: null,
  area_total_detalhe: null,
  area_total: null,
  area_privativa_detalhe: null,
  area_privativa: null,
  finalidade_oferta: null,
  area_total_oferta: null,
  area_privativa_oferta: null,
  valor_oferta: null,
  latitude: null,
  longitude: null,
  descricao_oferta: "",
  observacao: "",
  url: "",
  imobiliaria: "",
  codigo: "",
  infra: "",
  padrao: "",
  conservacao: "",
  vaga: "",
  origem: "manual",
};

function joinUnique(values: Array<string | null | undefined>): string | null {
  const uniqueValues = Array.from(
    new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)))
  );
  return uniqueValues.length > 0 ? uniqueValues.join(" | ") : null;
}

function sumValues(values: Array<number | null | undefined>): number | null {
  const validValues = values.filter((value): value is number => typeof value === "number");
  return validValues.length > 0
    ? Number(validValues.reduce((total, value) => total + value, 0).toFixed(2))
    : null;
}

function joinNumbers(values: Array<number | null | undefined>): string | null {
  const formattedValues = values
    .filter((value): value is number => typeof value === "number")
    .map((value) => String(value));
  return formattedValues.length > 0 ? formattedValues.join(" | ") : null;
}

function firstValue<T>(values: Array<T | null | undefined>): T | null {
  const found = values.find((value): value is T => value !== null && value !== undefined);
  return found ?? null;
}

function buildCadastroFields(records: CadastroBaseRecord[]): Pick<
  PropertyDraft,
  | "finalidade"
  | "num_bloco"
  | "num_inscricao"
  | "cod_endloc_logradouro"
  | "nme_endloc_logradouro"
  | "num_endloc_endereco"
  | "num_endloc_unidade"
  | "nme_endloc_bairro_cdl"
  | "rh_nome"
  | "rh_valor"
  | "coord_x"
  | "coord_y"
  | "ano_exercicio"
  | "num_versao"
  | "idf_reg_regiao_homogenea"
  | "area_total_detalhe"
  | "area_total"
  | "area_privativa_detalhe"
  | "area_privativa"
  | "latitude"
  | "longitude"
  | "origem"
> {
  return {
    finalidade: joinUnique(records.map((record) => record.des_finalidade)) ?? "RESIDENCIAL",
    num_bloco: joinUnique(records.map((record) => record.num_bloco)),
    num_inscricao: joinUnique(records.map((record) => record.num_inscricao)),
    cod_endloc_logradouro: joinUnique(records.map((record) => record.cod_endloc_logradouro)),
    nme_endloc_logradouro: joinUnique(records.map((record) => record.nme_endloc_logradouro)),
    num_endloc_endereco: joinUnique(records.map((record) => record.num_endloc_endereco)),
    num_endloc_unidade: joinUnique(records.map((record) => record.num_endloc_unidade)),
    nme_endloc_bairro_cdl: joinUnique(records.map((record) => record.nme_endloc_bairro_cdl)),
    rh_nome: firstValue(records.map((record) => record.rh_nome)),
    rh_valor: firstValue(records.map((record) => record.rh_valor)),
    coord_x: firstValue(records.map((record) => record.coord_x)),
    coord_y: firstValue(records.map((record) => record.coord_y)),
    ano_exercicio: firstValue(records.map((record) => record.ano_exercicio)),
    num_versao: firstValue(records.map((record) => record.num_versao)),
    idf_reg_regiao_homogenea: firstValue(records.map((record) => record.idf_reg_regiao_homogenea)),
    area_total_detalhe: joinNumbers(records.map((record) => record.area_territorial)),
    area_total: sumValues(records.map((record) => record.area_territorial)),
    area_privativa_detalhe: joinNumbers(records.map((record) => record.area_construida)),
    area_privativa: sumValues(records.map((record) => record.area_construida)),
    latitude: firstValue(records.map((record) => record.latitude)),
    longitude: firstValue(records.map((record) => record.longitude)),
    origem: "cadastro_base"
  };
}

function App() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [form, setForm] = useState<PropertyDraft>(initialForm);
  const [cadastroRecords, setCadastroRecords] = useState<CadastroBaseRecord[]>([]);
  const [searchMode, setSearchMode] = useState<"inscricao" | "endereco">("inscricao");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CadastroBaseRecord[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [activeClassifier, setActiveClassifier] =
    useState<keyof typeof CLASSIFICATION_GUIDES>("conservacao");
  const [openSections, setOpenSections] = useState({
    busca: true,
    cadastro: true,
    oferta: true,
    outras: true,
    tabela: true
  });

  async function loadProperties() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchProperties();
      setProperties(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProperties();
  }, []);

  function updateField<K extends keyof PropertyDraft>(field: K, value: PropertyDraft[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function applyCadastroBase(record: CadastroBaseRecord) {
    setCadastroRecords((current) => {
      const alreadyAdded = current.some((item) => item.num_inscricao === record.num_inscricao);
      const nextRecords = alreadyAdded ? current : [...current, record];
      setForm((formState) => ({
        ...formState,
        ...buildCadastroFields(nextRecords)
      }));
      return nextRecords;
    });
    setMessage("Imovel adicionado ao cadastro da oferta. Os campos continuam editaveis.");
    setError("");
  }

  function removeCadastroRecord(numInscricao: string) {
    setCadastroRecords((current) => {
      const nextRecords = current.filter((record) => record.num_inscricao !== numInscricao);
      setForm((formState) =>
        nextRecords.length > 0
          ? {
              ...formState,
              ...buildCadastroFields(nextRecords)
            }
          : {
              ...formState,
              finalidade: initialForm.finalidade,
              num_bloco: null,
              num_inscricao: null,
              cod_endloc_logradouro: null,
              nme_endloc_logradouro: null,
              num_endloc_endereco: null,
              num_endloc_unidade: null,
              nme_endloc_bairro_cdl: null,
              rh_nome: null,
              rh_valor: null,
              coord_x: null,
              coord_y: null,
              ano_exercicio: null,
              num_versao: null,
              idf_reg_regiao_homogenea: null,
              area_total_detalhe: null,
              area_total: null,
              area_privativa_detalhe: null,
              area_privativa: null,
              latitude: null,
              longitude: null,
              origem: "manual"
            }
      );
      return nextRecords;
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const created = await createProperty(form);
      setProperties((current) => [created, ...current]);
      setForm(initialForm);
      setCadastroRecords([]);
      setMessage("Imovel cadastrado com sucesso.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar cadastro.");
    }
  }

  async function handleCadastroSearch() {
    setSearching(true);
    setError("");
    setMessage("");

    try {
      const result = await searchCadastroBase(searchMode, searchQuery);
      setSearchResults(result.items);
      if (result.items.length === 0) {
        setMessage("Nenhum registro encontrado na base cadastral.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao consultar base cadastral.");
    } finally {
      setSearching(false);
    }
  }

  function handleExport() {
    window.open(getExportUrl(), "_blank", "noopener,noreferrer");
  }

  async function handleDelete(propertyId: number) {
    setError("");
    setMessage("");
    try {
      await deleteProperty(propertyId);
      setProperties((current) => current.filter((item) => item.id !== propertyId));
      setDeleteTarget(null);
      setMessage("Registro excluido com sucesso.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir registro.");
    }
  }

  function toggleSection(section: keyof typeof openSections) {
    setOpenSections((current) => ({ ...current, [section]: !current[section] }));
  }

  const activeGuide = CLASSIFICATION_GUIDES[activeClassifier];

  return (
    <div className="page">
      <header className="hero hero-logo-only">
        <img src={logoCdA} alt="cdA" className="hero-logo" />
        <div className="hero-search">
          <div className="hero-search-head">
            <p className="sequence-kicker">Busca cadastral</p>
            <h2>Inscricao ou endereco</h2>
          </div>
          <div className="search-bar">
                <select
                  value={searchMode}
                  onChange={(event) =>
                    setSearchMode(event.target.value as "inscricao" | "endereco")
                  }
                >
                  <option value="endereco">Endereco</option>
                  <option value="inscricao">Inscricao</option>
                </select>
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={
                searchMode === "inscricao"
                  ? "Ex.: 2720"
                  : "Ex.: RUA AFONSO ARINOS 115 ou RUA AFONSO ARINOS 115 2"
              }
            />
                <button type="button" onClick={() => void handleCadastroSearch()}>
                  {searching ? "Buscando..." : "Buscar"}
                </button>
              </div>
              <p className="hero-search-help">
                Em endereco, informe logradouro e numero. Se existir unidade, ela pode ser
                adicionada ao final da busca.
              </p>
            </div>
          </header>

      <main className="sequence">
        <section className="panel sequence-panel">
          <div className="sequence-head">
            <div className="sequence-index">01</div>
            <div>
              <p className="sequence-kicker">Etapa inicial</p>
              <h2>Resultados da busca</h2>
            </div>
            <button
              type="button"
              className="collapse-btn secondary"
              onClick={() => toggleSection("busca")}
            >
              {openSections.busca ? "Recolher" : "Expandir"}
            </button>
          </div>
          {openSections.busca ? (
            <div className="section-body">
              <p className="muted">
                Selecione um dos registros retornados para preencher automaticamente o formulario
                abaixo. A edicao continua livre depois disso.
              </p>

              <div className="result-list">
                {searchResults.length === 0 ? (
                  <div className="empty-state">Nenhum resultado carregado ainda.</div>
                ) : (
                  searchResults.map((item) => (
                    <button
                      type="button"
                      key={`${item.num_inscricao}-${item.num_endloc_endereco ?? ""}`}
                      className="result-card"
                      onClick={() => applyCadastroBase(item)}
                    >
                      <strong>{item.display_label}</strong>
                      <span className="result-line">
                        Finalidade: {item.des_finalidade ?? "-"}
                      </span>
                      <span className="result-line">
                        Area territorial: {item.area_territorial ?? "-"} | Area construida:{" "}
                        {item.area_construida ?? "-"}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : null}
        </section>

        <form onSubmit={handleSubmit} className="sequence-form">
          <section className="panel sequence-panel">
            <div className="sequence-head">
              <div className="sequence-index">02</div>
              <div>
                <p className="sequence-kicker">Novo registro</p>
                <h2>Cadastro</h2>
              </div>
              <button
                type="button"
                className="collapse-btn secondary"
                onClick={() => toggleSection("cadastro")}
              >
                {openSections.cadastro ? "Recolher" : "Expandir"}
              </button>
            </div>
            {openSections.cadastro ? (
              <div className="section-body">
                <div className="form-banner">
                  Adicione uma ou mais inscricoes para a mesma oferta. A planilha final mantem uma
                  linha por oferta, com os dados cadastrais consolidados.
                </div>
                <div className="selected-cadastros">
                  <div className="selected-cadastros-head">
                    <strong>Imoveis desta oferta</strong>
                    <span>{cadastroRecords.length} selecionado(s)</span>
                  </div>
                  {cadastroRecords.length === 0 ? (
                    <p className="muted">Nenhuma inscricao adicionada ainda.</p>
                  ) : (
                    <div className="selected-cadastro-list">
                      {cadastroRecords.map((record) => (
                        <div className="selected-cadastro-item" key={record.num_inscricao}>
                          <div>
                            <strong>{record.num_inscricao}</strong>
                            <span>
                              {[record.nme_endloc_logradouro, record.num_endloc_endereco]
                                .filter(Boolean)
                                .join(", ") || "-"}
                              {record.num_endloc_unidade ? ` / ${record.num_endloc_unidade}` : ""}
                            </span>
                          </div>
                          <button
                            type="button"
                            className="secondary"
                            onClick={() => removeCadastroRecord(record.num_inscricao)}
                          >
                            Remover
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="form-grid cadastro-grid">
                  <label>
                    NUM_BLOCO
                    <input
                      value={form.num_bloco ?? ""}
                      onChange={(event) => updateField("num_bloco", event.target.value || null)}
                    />
                  </label>

                  <label>
                    NUM_INSCRICAO
                    <input
                      value={form.num_inscricao ?? ""}
                      onChange={(event) => updateField("num_inscricao", event.target.value || null)}
                    />
                  </label>

                  <label>
                    COD_ENDLOC_LOGRADOURO
                    <input
                      value={form.cod_endloc_logradouro ?? ""}
                      onChange={(event) =>
                        updateField("cod_endloc_logradouro", event.target.value || null)
                      }
                    />
                  </label>

                  <label>
                    NME_ENDLOC_LOGRADOURO
                    <input
                      value={form.nme_endloc_logradouro ?? ""}
                      onChange={(event) =>
                        updateField("nme_endloc_logradouro", event.target.value || null)
                      }
                    />
                  </label>

                  <label>
                    NUM_ENDLOC_ENDERECO
                    <input
                      value={form.num_endloc_endereco ?? ""}
                      onChange={(event) =>
                        updateField("num_endloc_endereco", event.target.value || null)
                      }
                    />
                  </label>

                  <label>
                    NUM_ENDLOC_UNIDADE
                    <input
                      value={form.num_endloc_unidade ?? ""}
                      onChange={(event) =>
                        updateField("num_endloc_unidade", event.target.value || null)
                      }
                    />
                  </label>

                  <label>
                    NME_ENDLOC_BAIRRO_CDL
                    <input
                      value={form.nme_endloc_bairro_cdl ?? ""}
                      onChange={(event) =>
                        updateField("nme_endloc_bairro_cdl", event.target.value || null)
                      }
                    />
                  </label>

                  <label>
                    DES_FINALIDADE
                    <input
                      value={form.finalidade}
                      onChange={(event) => updateField("finalidade", event.target.value)}
                    />
                  </label>

                  <label>
                    AREA_TERRITORIAL_SEPARADA
                    <input
                      value={form.area_total_detalhe ?? ""}
                      onChange={(event) =>
                        updateField("area_total_detalhe", event.target.value || null)
                      }
                    />
                  </label>

                  <label>
                    AREA_TERRITORIAL_SOMA
                    <input
                      type="number"
                      step="0.01"
                      value={form.area_total ?? ""}
                      onChange={(event) =>
                        updateField(
                          "area_total",
                          event.target.value ? Number(event.target.value) : null
                        )
                      }
                    />
                  </label>

                  <label>
                    AREA_CONSTRUIDA_SEPARADA
                    <input
                      value={form.area_privativa_detalhe ?? ""}
                      onChange={(event) =>
                        updateField("area_privativa_detalhe", event.target.value || null)
                      }
                    />
                  </label>

                  <label>
                    AREA_CONSTRUIDA_SOMA
                    <input
                      type="number"
                      step="0.01"
                      value={form.area_privativa ?? ""}
                      onChange={(event) =>
                        updateField(
                          "area_privativa",
                          event.target.value ? Number(event.target.value) : null
                        )
                      }
                    />
                  </label>

                  <label>
                    RH_NOME
                    <input
                      value={form.rh_nome ?? ""}
                      onChange={(event) => updateField("rh_nome", event.target.value || null)}
                    />
                  </label>

                  <label>
                    RH_VALOR
                    <input
                      type="number"
                      step="0.01"
                      value={form.rh_valor ?? ""}
                      onChange={(event) =>
                        updateField(
                          "rh_valor",
                          event.target.value ? Number(event.target.value) : null
                        )
                      }
                    />
                  </label>

                  <label>
                    LATITUDE
                    <input
                      type="number"
                      step="0.000001"
                      value={form.latitude ?? ""}
                      onChange={(event) =>
                        updateField(
                          "latitude",
                          event.target.value ? Number(event.target.value) : null
                        )
                      }
                    />
                  </label>

                  <label>
                    LONGITUDE
                    <input
                      type="number"
                      step="0.000001"
                      value={form.longitude ?? ""}
                      onChange={(event) =>
                        updateField(
                          "longitude",
                          event.target.value ? Number(event.target.value) : null
                        )
                      }
                    />
                  </label>
                </div>
              </div>
            ) : null}
          </section>

          <section className="panel sequence-panel">
            <div className="sequence-head">
              <div className="sequence-index">03</div>
              <div>
                <p className="sequence-kicker">Novo registro</p>
                <h2>Oferta</h2>
              </div>
              <button
                type="button"
                className="collapse-btn secondary"
                onClick={() => toggleSection("oferta")}
              >
                {openSections.oferta ? "Recolher" : "Expandir"}
              </button>
            </div>
            {openSections.oferta ? (
              <div className="section-body">
                <div className="form-grid offer-grid">
                <label>
                  Finalidade oferta
                  <select
                    value={form.finalidade_oferta ?? ""}
                    onChange={(event) =>
                      updateField("finalidade_oferta", event.target.value || null)
                    }
                  >
                    <option value="">Selecione</option>
                    <option value="Andar comercial">Andar comercial</option>
                    <option value="Casa comercial">Casa comercial</option>
                    <option value="Edificio isolado">Edificio isolado</option>
                    <option value="Estacionamento">Estacionamento</option>
                    <option value="Imovel especial">Imovel especial</option>
                    <option value="Loja em conjunto comercial">Loja em conjunto comercial</option>
                    <option value="Loja em galeria fechada">Loja em galeria fechada</option>
                    <option value="Loja em shopping fechado">Loja em shopping fechado</option>
                    <option value="Loja isolada">Loja isolada</option>
                    <option value="Loja nao isolada">Loja nao isolada</option>
                    <option value="Loja terrea em edificio">Loja terrea em edificio</option>
                    <option value="Sala comercial">Sala comercial</option>
                    <option value="Terreno">Terreno</option>
                  </select>
                </label>

                <label>
                  Area total oferta
                  <input
                    type="number"
                    step="0.01"
                    value={form.area_total_oferta ?? ""}
                    onChange={(event) =>
                      updateField(
                        "area_total_oferta",
                        event.target.value ? Number(event.target.value) : null
                      )
                    }
                  />
                </label>

                <label>
                  Area privativa oferta
                  <input
                    type="number"
                    step="0.01"
                    value={form.area_privativa_oferta ?? ""}
                    onChange={(event) =>
                      updateField(
                        "area_privativa_oferta",
                        event.target.value ? Number(event.target.value) : null
                      )
                    }
                  />
                </label>

                <label>
                  Valor oferta
                  <input
                    type="number"
                    step="0.01"
                    value={form.valor_oferta ?? ""}
                    onChange={(event) =>
                      updateField(
                        "valor_oferta",
                        event.target.value ? Number(event.target.value) : null
                      )
                    }
                  />
                </label>

                <label className="offer-wide">
                  Descricao oferta
                  <textarea
                    value={form.descricao_oferta ?? ""}
                    onChange={(event) =>
                      updateField("descricao_oferta", event.target.value || null)
                    }
                    rows={4}
                  />
                </label>

                <label className="offer-wide">
                  Observacao
                  <textarea
                    value={form.observacao ?? ""}
                    onChange={(event) => updateField("observacao", event.target.value || null)}
                    rows={3}
                  />
                </label>

                <label>
                  URL
                  <input
                    value={form.url ?? ""}
                    onChange={(event) => updateField("url", event.target.value || null)}
                  />
                </label>

                <label>
                  Imobiliaria
                  <input
                    value={form.imobiliaria ?? ""}
                    onChange={(event) => updateField("imobiliaria", event.target.value || null)}
                  />
                </label>

                <label>
                  Codigo
                  <input
                    value={form.codigo ?? ""}
                    onChange={(event) => updateField("codigo", event.target.value || null)}
                  />
                </label>

                </div>
              </div>
            ) : null}
          </section>

          <section className="panel sequence-panel">
            <div className="sequence-head">
              <div className="sequence-index">04</div>
              <div>
                <p className="sequence-kicker">Novo registro</p>
                <h2>Outras Caracteristicas</h2>
              </div>
              <button
                type="button"
                className="collapse-btn secondary"
                onClick={() => toggleSection("outras")}
              >
                {openSections.outras ? "Recolher" : "Expandir"}
              </button>
            </div>
            {openSections.outras ? (
              <div className="section-body">
                <div className="classification-layout">
                  <div className="classification-controls">
                    <div className="classification-row">
                      <label>
                        Infra
                        <select
                          value={form.infra ?? ""}
                          onChange={(event) => updateField("infra", event.target.value || null)}
                        >
                          <option value="">Selecione</option>
                          <option value="Minima">Minima</option>
                          <option value="Basica">Basica</option>
                          <option value="Intermediaria">Intermediaria</option>
                          <option value="Completa">Completa</option>
                        </select>
                      </label>
                      <button
                        type="button"
                        className="secondary classify-btn"
                        onClick={() => setActiveClassifier("infra")}
                      >
                        Classificar
                      </button>
                    </div>

                    <div className="classification-row">
                      <label>
                        Padrao
                        <select
                          value={form.padrao ?? ""}
                          onChange={(event) => updateField("padrao", event.target.value || null)}
                        >
                          <option value="">Selecione</option>
                          <option value="Baixo">Baixo</option>
                          <option value="Normal">Normal</option>
                          <option value="Normal/Alto">Normal/Alto</option>
                          <option value="Alto">Alto</option>
                        </select>
                      </label>
                      <button
                        type="button"
                        className="secondary classify-btn"
                        onClick={() => setActiveClassifier("padrao")}
                      >
                        Classificar
                      </button>
                    </div>

                    <div className="classification-row">
                      <label>
                        Conservacao
                        <select
                          value={form.conservacao ?? ""}
                          onChange={(event) =>
                            updateField("conservacao", event.target.value || null)
                          }
                        >
                          <option value="">Selecione</option>
                          {CONSERVACAO_OPTIONS.map((option) => (
                            <option key={option.categoria} value={option.categoria}>
                              {option.categoria}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        type="button"
                        className="secondary classify-btn"
                        onClick={() => setActiveClassifier("conservacao")}
                      >
                        Classificar
                      </button>
                    </div>

                    <div className="classification-row">
                      <label>
                        Vaga
                        <select
                          value={form.vaga ?? ""}
                          onChange={(event) => updateField("vaga", event.target.value || null)}
                        >
                          <option value="">Selecione</option>
                          <option value="Sim">Sim</option>
                          <option value="Nao - facilidade de estacionamento">
                            Nao - facilidade de estacionamento
                          </option>
                          <option value="Nao - dificuldade de estacionamento">
                            Nao - dificuldade de estacionamento
                          </option>
                        </select>
                      </label>
                      <button
                        type="button"
                        className="secondary classify-btn"
                        onClick={() => setActiveClassifier("vaga")}
                      >
                        Classificar
                      </button>
                    </div>
                  </div>

                  <div className="criteria-panel">
                    <div className="criteria-head">
                      <strong>{activeGuide.titulo}</strong>
                      <span>{activeGuide.descricao}</span>
                      <span className="criteria-status">{activeGuide.status}</span>
                    </div>
                    <div className="criteria-grid">
                      {activeGuide.blocos.map((bloco) => (
                        (() => {
                          const blocoValor = "valor" in bloco ? bloco.valor : undefined;
                          return (
                        <button
                          key={bloco.titulo}
                          type="button"
                          className={`criteria-card${
                            blocoValor &&
                            ((activeClassifier === "conservacao" &&
                              form.conservacao === blocoValor) ||
                              (activeClassifier === "vaga" && form.vaga === blocoValor))
                              ? " is-selected"
                              : ""
                          }`}
                          onClick={() => {
                            if (!blocoValor) {
                              return;
                            }
                            if (activeClassifier === "conservacao") {
                              updateField("conservacao", blocoValor);
                            }
                            if (activeClassifier === "vaga") {
                              updateField("vaga", blocoValor);
                            }
                          }}
                        >
                          <strong>{bloco.titulo}</strong>
                          <ul>
                            {bloco.itens.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </button>
                          );
                        })()
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </section>

          <div className="form-actions form-actions-outside">
            <button type="submit">Salvar registro</button>
          </div>
        </form>

        <section className="panel sequence-panel full-width">
          <div className="sequence-head">
            <div className="sequence-index">05</div>
              <div>
                <p className="sequence-kicker">Base consolidada</p>
                <h2>Banco de dados</h2>
              </div>
              <button
                type="button"
                className="collapse-btn secondary"
                onClick={() => toggleSection("tabela")}
              >
                {openSections.tabela ? "Recolher" : "Expandir"}
              </button>
            </div>
          {openSections.tabela ? (
            <div className="section-body">
              <div className="section-head">
                <h2>Tabela final</h2>
                <div className="actions">
                  <button type="button" className="secondary" onClick={() => void loadProperties()}>
                    Atualizar
                  </button>
                  <button type="button" className="secondary" onClick={handleExport}>
                    Exportar planilha
                  </button>
                </div>
              </div>

              {loading ? <p className="muted">Carregando...</p> : null}
              {message ? <p className="success">{message}</p> : null}
              {error ? <p className="error">{error}</p> : null}

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Inscricao(s)</th>
                      <th>Endereco</th>
                      <th>Cadastro</th>
                      <th>Oferta</th>
                      <th>Outras caracteristicas</th>
                      <th>Acao</th>
                    </tr>
                  </thead>
                  <tbody>
                    {properties.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="empty-cell">
                          Nenhum registro salvo.
                        </td>
                      </tr>
                    ) : (
                      properties.map((property) => (
                        <tr key={property.id}>
                          <td>{property.id}</td>
                          <td>{property.num_inscricao ?? "-"}</td>
                          <td>
                            {[property.nme_endloc_logradouro, property.num_endloc_endereco]
                              .filter(Boolean)
                              .join(", ")}
                            {property.num_endloc_unidade ? ` / ${property.num_endloc_unidade}` : ""}
                            {!property.nme_endloc_logradouro && !property.num_endloc_endereco
                              ? "-"
                              : ""}
                          </td>
                          <td>
                            {[
                              `Finalidade: ${property.finalidade ?? "-"}`,
                              `Area total: ${property.area_total_detalhe ?? "-"} | Soma: ${
                                property.area_total ?? "-"
                              }`,
                              `Area privativa: ${property.area_privativa_detalhe ?? "-"} | Soma: ${
                                property.area_privativa ?? "-"
                              }`,
                              `Bairro: ${property.nme_endloc_bairro_cdl ?? "-"}`,
                            ].join(" | ")}
                          </td>
                          <td>
                            {[
                              `Finalidade: ${property.finalidade_oferta ?? "-"}`,
                              `Valor: ${property.valor_oferta ?? "-"}`,
                              `Imobiliaria: ${property.imobiliaria ?? "-"}`,
                              `Codigo: ${property.codigo ?? "-"}`,
                            ].join(" | ")}
                          </td>
                          <td>
                            {[
                              `Infra: ${property.infra ?? "-"}`,
                              `Padrao: ${property.padrao ?? "-"}`,
                              `Conservacao: ${property.conservacao ?? "-"}`,
                              `Vaga: ${property.vaga ?? "-"}`,
                            ].join(" | ")}
                          </td>
                          <td className="action-cell">
                            {deleteTarget === property.id ? (
                              <div className="delete-confirm">
                                <button
                                  type="button"
                                  className="secondary danger-soft"
                                  onClick={() => void handleDelete(property.id)}
                                >
                                  Confirmar
                                </button>
                                <button
                                  type="button"
                                  className="secondary"
                                  onClick={() => setDeleteTarget(null)}
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="secondary danger-soft"
                                onClick={() => setDeleteTarget(property.id)}
                              >
                                Excluir
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}

export default App;
