from pydantic import BaseModel, ConfigDict, Field


class PropertyBase(BaseModel):
    titulo: str | None = Field(default=None, min_length=2, max_length=150)
    finalidade: str = Field(min_length=2, max_length=50)
    num_inscricao: str | None = Field(default=None, max_length=30)
    nme_endloc_logradouro: str | None = Field(default=None, max_length=150)
    num_endloc_endereco: str | None = Field(default=None, max_length=30)
    num_endloc_unidade: str | None = Field(default=None, max_length=30)
    nme_endloc_bairro_cdl: str | None = Field(default=None, max_length=120)
    area_total: float | None = Field(default=None, ge=0)
    area_privativa: float | None = Field(default=None, ge=0)
    finalidade_oferta: str | None = Field(default=None, max_length=50)
    area_total_oferta: float | None = Field(default=None, ge=0)
    area_privativa_oferta: float | None = Field(default=None, ge=0)
    valor_oferta: float | None = Field(default=None, ge=0)
    latitude: float | None = None
    longitude: float | None = None
    descricao_oferta: str | None = None
    observacao: str | None = None
    url: str | None = None
    imobiliaria: str | None = Field(default=None, max_length=150)
    codigo: str | None = Field(default=None, max_length=80)
    infra: str | None = None
    padrao: str | None = Field(default=None, max_length=80)
    vaga: str | None = Field(default=None, max_length=80)
    origem: str = "manual"


class PropertyCreate(PropertyBase):
    pass


class PropertyRead(PropertyBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class SpreadsheetPreview(BaseModel):
    file_name: str
    columns: list[str]
    rows: list[dict]
    total_rows: int


class CadastroBaseRecord(BaseModel):
    num_inscricao: str
    nme_endloc_logradouro: str | None = None
    num_endloc_endereco: str | None = None
    num_endloc_unidade: str | None = None
    nme_endloc_bairro_cdl: str | None = None
    des_finalidade: str | None = None
    area_territorial: float | None = None
    area_construida: float | None = None
    latitude: float | None = None
    longitude: float | None = None
    titulo_sugerido: str
    display_label: str


class CadastroBaseSearchResponse(BaseModel):
    mode: str
    total: int
    items: list[CadastroBaseRecord]
