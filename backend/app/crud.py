from sqlalchemy import select
from sqlalchemy.orm import Session

from . import models, schemas


def list_properties(db: Session) -> list[models.Property]:
    return list(db.scalars(select(models.Property).order_by(models.Property.id.desc())))


def create_property(db: Session, payload: schemas.PropertyCreate) -> models.Property:
    data = payload.model_dump()
    if not data.get("titulo"):
        endereco = " ".join(
            part
            for part in [data.get("nme_endloc_logradouro"), data.get("num_endloc_endereco")]
            if part
        ).strip()
        data["titulo"] = endereco or data.get("num_inscricao") or "Novo registro"
    item = models.Property(**data)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def delete_property(db: Session, property_id: int) -> bool:
    item = db.get(models.Property, property_id)
    if item is None:
        return False
    db.delete(item)
    db.commit()
    return True


def export_properties(db: Session) -> list[dict]:
    items = list_properties(db)
    return [
        {
            "id": item.id,
            "num_bloco": item.num_bloco,
            "num_inscricao": item.num_inscricao,
            "cod_endloc_logradouro": item.cod_endloc_logradouro,
            "logradouro": item.nme_endloc_logradouro,
            "numero": item.num_endloc_endereco,
            "unidade": item.num_endloc_unidade,
            "bairro": item.nme_endloc_bairro_cdl,
            "finalidade": item.finalidade,
            "rh_nome": item.rh_nome,
            "rh_valor": item.rh_valor,
            "area_total_separada": item.area_total_detalhe,
            "area_total_soma": item.area_total,
            "area_privativa_separada": item.area_privativa_detalhe,
            "area_privativa_soma": item.area_privativa,
            "finalidade_oferta": item.finalidade_oferta,
            "area_total_oferta": item.area_total_oferta,
            "area_privativa_oferta": item.area_privativa_oferta,
            "valor_oferta": item.valor_oferta,
            "latitude": item.latitude,
            "longitude": item.longitude,
            "descricao_oferta": item.descricao_oferta,
            "observacao": item.observacao,
            "url": item.url,
            "imobiliaria": item.imobiliaria,
            "codigo": item.codigo,
            "infra": item.infra,
            "padrao": item.padrao,
            "conservacao": item.conservacao,
            "vaga": item.vaga,
        }
        for item in items
    ]
