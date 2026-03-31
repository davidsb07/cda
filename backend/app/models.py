from sqlalchemy import Float, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class Property(Base):
    __tablename__ = "properties"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    titulo: Mapped[str] = mapped_column(String(150), nullable=False)
    finalidade: Mapped[str] = mapped_column(String(50), nullable=False)
    num_bloco: Mapped[str | None] = mapped_column(String(30), nullable=True)
    num_inscricao: Mapped[str | None] = mapped_column(String(30), nullable=True, index=True)
    cod_endloc_logradouro: Mapped[str | None] = mapped_column(String(30), nullable=True)
    nme_endloc_logradouro: Mapped[str | None] = mapped_column(String(150), nullable=True, index=True)
    num_endloc_endereco: Mapped[str | None] = mapped_column(String(30), nullable=True)
    num_endloc_unidade: Mapped[str | None] = mapped_column(String(30), nullable=True)
    nme_endloc_bairro_cdl: Mapped[str | None] = mapped_column(String(120), nullable=True)
    rh_nome: Mapped[str | None] = mapped_column(String(80), nullable=True)
    rh_valor: Mapped[float | None] = mapped_column(Float, nullable=True)
    coord_x: Mapped[float | None] = mapped_column(Float, nullable=True)
    coord_y: Mapped[float | None] = mapped_column(Float, nullable=True)
    ano_exercicio: Mapped[float | None] = mapped_column(Float, nullable=True)
    num_versao: Mapped[float | None] = mapped_column(Float, nullable=True)
    idf_reg_regiao_homogenea: Mapped[float | None] = mapped_column(Float, nullable=True)
    area_total: Mapped[float | None] = mapped_column(Float, nullable=True)
    area_privativa: Mapped[float | None] = mapped_column(Float, nullable=True)
    finalidade_oferta: Mapped[str | None] = mapped_column(String(50), nullable=True)
    area_total_oferta: Mapped[float | None] = mapped_column(Float, nullable=True)
    area_privativa_oferta: Mapped[float | None] = mapped_column(Float, nullable=True)
    valor_oferta: Mapped[float | None] = mapped_column(Float, nullable=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    descricao_oferta: Mapped[str | None] = mapped_column(Text, nullable=True)
    observacao: Mapped[str | None] = mapped_column(Text, nullable=True)
    url: Mapped[str | None] = mapped_column(Text, nullable=True)
    imobiliaria: Mapped[str | None] = mapped_column(String(150), nullable=True)
    codigo: Mapped[str | None] = mapped_column(String(80), nullable=True)
    infra: Mapped[str | None] = mapped_column(Text, nullable=True)
    padrao: Mapped[str | None] = mapped_column(String(80), nullable=True)
    conservacao: Mapped[str | None] = mapped_column(String(80), nullable=True)
    vaga: Mapped[str | None] = mapped_column(String(80), nullable=True)
    origem: Mapped[str] = mapped_column(String(30), default="manual", nullable=False)
