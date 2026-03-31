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

const initialForm: PropertyDraft = {
  titulo: null,
  finalidade: "RESIDENCIAL",
  num_inscricao: null,
  nme_endloc_logradouro: null,
  num_endloc_endereco: null,
  num_endloc_unidade: null,
  nme_endloc_bairro_cdl: null,
  area_total: null,
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
  vaga: "",
  origem: "manual",
};

function App() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [form, setForm] = useState<PropertyDraft>(initialForm);
  const [searchMode, setSearchMode] = useState<"inscricao" | "endereco">("inscricao");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CadastroBaseRecord[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
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
    setForm((current) => ({
      ...current,
      finalidade: record.des_finalidade || current.finalidade,
      num_inscricao: record.num_inscricao,
      nme_endloc_logradouro: record.nme_endloc_logradouro,
      num_endloc_endereco: record.num_endloc_endereco,
      num_endloc_unidade: record.num_endloc_unidade,
      nme_endloc_bairro_cdl: record.nme_endloc_bairro_cdl,
      area_total: record.area_territorial,
      area_privativa: record.area_construida,
      latitude: record.latitude,
      longitude: record.longitude,
      origem: "cadastro_base"
    }));
    setMessage("Dados cadastrais aplicados ao formulario. Todos os campos continuam editaveis.");
    setError("");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const created = await createProperty(form);
      setProperties((current) => [created, ...current]);
      setForm(initialForm);
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
                  Os dados encontrados podem ser ajustados livremente antes do salvamento. A base
                  auxiliar permanece intacta.
                </div>
                <div className="form-grid">
                <label>
                  Finalidade cadastro
                  <input
                    value={form.finalidade}
                    onChange={(event) => updateField("finalidade", event.target.value)}
                    placeholder="Residencial, apartamento..."
                  />
                </label>

                <label>
                  Numero de inscricao
                  <input
                    value={form.num_inscricao ?? ""}
                    onChange={(event) => updateField("num_inscricao", event.target.value || null)}
                  />
                </label>

                <label>
                  Logradouro
                  <input
                    value={form.nme_endloc_logradouro ?? ""}
                    onChange={(event) =>
                      updateField("nme_endloc_logradouro", event.target.value || null)
                    }
                  />
                </label>

                <label>
                  Numero
                  <input
                    value={form.num_endloc_endereco ?? ""}
                    onChange={(event) =>
                      updateField("num_endloc_endereco", event.target.value || null)
                    }
                  />
                </label>

                <label>
                  Unidade
                  <input
                    value={form.num_endloc_unidade ?? ""}
                    onChange={(event) =>
                      updateField("num_endloc_unidade", event.target.value || null)
                    }
                  />
                </label>

                <label>
                  Bairro
                  <input
                    value={form.nme_endloc_bairro_cdl ?? ""}
                    onChange={(event) =>
                      updateField("nme_endloc_bairro_cdl", event.target.value || null)
                    }
                  />
                </label>

                <label>
                  Latitude
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
                  Longitude
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

                <label>
                  Area total
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
                  Area privativa
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

                <label>
                  Origem
                  <select
                    value={form.origem}
                    onChange={(event) => updateField("origem", event.target.value)}
                  >
                    <option value="manual">manual</option>
                    <option value="cadastro_base">cadastro_base</option>
                  </select>
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
                <div className="form-grid">
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

                <label>
                  Vaga
                  <select
                    value={form.vaga ?? ""}
                    onChange={(event) => updateField("vaga", event.target.value || null)}
                  >
                    <option value="">Selecione</option>
                    <option value="Sim">Sim</option>
                    <option value="Nao">Nao</option>
                  </select>
                </label>
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
                      <th>Inscricao</th>
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
                              `Area total: ${property.area_total ?? "-"}`,
                              `Area privativa: ${property.area_privativa ?? "-"}`,
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
