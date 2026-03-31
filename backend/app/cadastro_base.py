from functools import lru_cache
from pathlib import Path

import pandas as pd

from .schemas import CadastroBaseRecord


BASE_FILE = Path(__file__).resolve().parent.parent / "data" / "base" / "AUXILIAR_INSCRICOES.txt"
BASE_COLUMNS = [
    "NUM_INSCRICAO",
    "NME_ENDLOC_LOGRADOURO",
    "NUM_ENDLOC_ENDERECO",
    "NUM_ENDLOC_UNIDADE",
    "NME_ENDLOC_BAIRRO_CDL",
    "DES_FINALIDADE",
    "AREA_TERRITORIAL",
    "AREA_CONSTRUIDA",
    "LATITUDE",
    "LONGITUDE",
]


def _parse_decimal(value: str | None) -> float | None:
    if value is None or value == "":
        return None
    try:
        return float(str(value).replace(".", "").replace(",", "."))
    except ValueError:
        try:
            return float(str(value).replace(",", "."))
        except ValueError:
            return None


def _normalize_text(value: str | None) -> str:
    return (value or "").strip().upper()


@lru_cache(maxsize=1)
def load_cadastro_base() -> pd.DataFrame:
    if not BASE_FILE.exists():
        raise FileNotFoundError(f"Base auxiliar nao encontrada em {BASE_FILE}")

    df = pd.read_csv(
        BASE_FILE,
        sep="|",
        dtype=str,
        usecols=BASE_COLUMNS,
        keep_default_na=False,
        encoding="utf-8",
    )

    df["SEARCH_INSCRICAO"] = df["NUM_INSCRICAO"].map(_normalize_text)
    df["SEARCH_ADDRESS"] = (
        df["NME_ENDLOC_LOGRADOURO"].map(_normalize_text)
        + " "
        + df["NUM_ENDLOC_ENDERECO"].map(_normalize_text)
        + " "
        + df["NUM_ENDLOC_UNIDADE"].map(_normalize_text)
    ).str.strip()

    return df


def _to_record(row: pd.Series) -> CadastroBaseRecord:
    logradouro = row.get("NME_ENDLOC_LOGRADOURO") or None
    numero = row.get("NUM_ENDLOC_ENDERECO") or None
    bairro = row.get("NME_ENDLOC_BAIRRO_CDL") or None
    finalidade = row.get("DES_FINALIDADE") or None
    unidade = row.get("NUM_ENDLOC_UNIDADE") or None
    num_inscricao = row.get("NUM_INSCRICAO") or ""

    endereco_base = " ".join(part for part in [logradouro, numero] if part)
    titulo_sugerido = endereco_base or f"Inscricao {num_inscricao}"
    label_parts = [f"Inscricao {num_inscricao}"]
    if endereco_base:
        label_parts.append(endereco_base)
    if unidade:
        label_parts.append(f"Unidade {unidade}")
    if bairro:
        label_parts.append(bairro)

    return CadastroBaseRecord(
        num_inscricao=num_inscricao,
        nme_endloc_logradouro=logradouro,
        num_endloc_endereco=numero,
        num_endloc_unidade=unidade,
        nme_endloc_bairro_cdl=bairro,
        des_finalidade=finalidade,
        area_territorial=_parse_decimal(row.get("AREA_TERRITORIAL")),
        area_construida=_parse_decimal(row.get("AREA_CONSTRUIDA")),
        latitude=_parse_decimal(row.get("LATITUDE")),
        longitude=_parse_decimal(row.get("LONGITUDE")),
        titulo_sugerido=titulo_sugerido,
        display_label=" | ".join(label_parts),
    )


def search_cadastro_base(mode: str, query: str, limit: int = 20) -> list[CadastroBaseRecord]:
    if mode not in {"inscricao", "endereco"}:
        raise ValueError("Modo de busca invalido.")

    cleaned_query = _normalize_text(query)
    if len(cleaned_query) < 2:
        return []

    df = load_cadastro_base()

    if mode == "inscricao":
        filtered = df[df["SEARCH_INSCRICAO"].str.contains(cleaned_query, na=False)]
    else:
        terms = [term for term in cleaned_query.split() if term]
        filtered = df
        for term in terms:
            filtered = filtered[filtered["SEARCH_ADDRESS"].str.contains(term, na=False)]

    if filtered.empty:
        return []

    rows = filtered.head(limit).to_dict(orient="records")
    return [_to_record(pd.Series(row)) for row in rows]
