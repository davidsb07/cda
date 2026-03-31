import csv
import sqlite3
from pathlib import Path

from .schemas import CadastroBaseRecord


BASE_FILE = Path(__file__).resolve().parent.parent / "data" / "base" / "AUXILIAR_INSCRICOES.txt"
SQLITE_FILE = Path(__file__).resolve().parent.parent / "data" / "base" / "cadastro_base.db"
BASE_COLUMNS = [
    "NUM_BLOCO",
    "NUM_INSCRICAO",
    "COD_ENDLOC_LOGRADOURO",
    "NME_ENDLOC_LOGRADOURO",
    "NUM_ENDLOC_ENDERECO",
    "NUM_ENDLOC_UNIDADE",
    "NME_ENDLOC_BAIRRO_CDL",
    "DES_FINALIDADE",
    "RH_NOME",
    "RH_VALOR",
    "COORD_X",
    "COORD_Y",
    "ANO_EXERCICIO",
    "NUM_VERSAO",
    "IDF_REG_REGIAO_HOMOGENEA",
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


def _to_record(row: dict[str, str | None]) -> CadastroBaseRecord:
    logradouro = row.get("nme_endloc_logradouro") or None
    numero = row.get("num_endloc_endereco") or None
    bairro = row.get("nme_endloc_bairro_cdl") or None
    finalidade = row.get("des_finalidade") or None
    unidade = row.get("num_endloc_unidade") or None
    num_inscricao = row.get("num_inscricao") or ""

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
        num_bloco=row.get("num_bloco") or None,
        num_inscricao=num_inscricao,
        cod_endloc_logradouro=row.get("cod_endloc_logradouro") or None,
        nme_endloc_logradouro=logradouro,
        num_endloc_endereco=numero,
        num_endloc_unidade=unidade,
        nme_endloc_bairro_cdl=bairro,
        des_finalidade=finalidade,
        rh_nome=row.get("rh_nome") or None,
        rh_valor=_parse_decimal(row.get("rh_valor")),
        coord_x=_parse_decimal(row.get("coord_x")),
        coord_y=_parse_decimal(row.get("coord_y")),
        ano_exercicio=_parse_decimal(row.get("ano_exercicio")),
        num_versao=_parse_decimal(row.get("num_versao")),
        idf_reg_regiao_homogenea=_parse_decimal(row.get("idf_reg_regiao_homogenea")),
        area_territorial=_parse_decimal(row.get("area_territorial")),
        area_construida=_parse_decimal(row.get("area_construida")),
        latitude=_parse_decimal(row.get("latitude")),
        longitude=_parse_decimal(row.get("longitude")),
        titulo_sugerido=titulo_sugerido,
        display_label=" | ".join(label_parts),
    )


def _connect_sqlite() -> sqlite3.Connection:
    connection = sqlite3.connect(SQLITE_FILE)
    connection.row_factory = sqlite3.Row
    return connection


def _needs_rebuild() -> bool:
    if not BASE_FILE.exists():
        raise FileNotFoundError(f"Base auxiliar nao encontrada em {BASE_FILE}")
    if not SQLITE_FILE.exists():
        return True
    try:
        with _connect_sqlite() as connection:
            existing_columns = {
                row["name"]
                for row in connection.execute("PRAGMA table_info(cadastro_base)").fetchall()
            }
    except sqlite3.DatabaseError:
        return True

    required_columns = {
        "num_bloco",
        "num_inscricao",
        "cod_endloc_logradouro",
        "nme_endloc_logradouro",
        "num_endloc_endereco",
        "num_endloc_unidade",
        "nme_endloc_bairro_cdl",
        "des_finalidade",
        "rh_nome",
        "rh_valor",
        "coord_x",
        "coord_y",
        "ano_exercicio",
        "num_versao",
        "idf_reg_regiao_homogenea",
        "area_territorial",
        "area_construida",
        "latitude",
        "longitude",
        "search_inscricao",
        "search_address",
    }
    if not required_columns.issubset(existing_columns):
        return True
    return SQLITE_FILE.stat().st_mtime < BASE_FILE.stat().st_mtime


def ensure_cadastro_base_sqlite(force_rebuild: bool = False) -> tuple[Path, int]:
    if not force_rebuild and not _needs_rebuild():
        with _connect_sqlite() as connection:
            row = connection.execute("SELECT COUNT(*) AS total FROM cadastro_base").fetchone()
            return SQLITE_FILE, int(row["total"])

    SQLITE_FILE.parent.mkdir(parents=True, exist_ok=True)
    temp_db = SQLITE_FILE.with_suffix(".tmp")
    if temp_db.exists():
        temp_db.unlink()

    connection = sqlite3.connect(temp_db)
    try:
        connection.execute(
            """
            CREATE TABLE cadastro_base (
                num_bloco TEXT,
                num_inscricao TEXT,
                cod_endloc_logradouro TEXT,
                nme_endloc_logradouro TEXT,
                num_endloc_endereco TEXT,
                num_endloc_unidade TEXT,
                nme_endloc_bairro_cdl TEXT,
                des_finalidade TEXT,
                rh_nome TEXT,
                rh_valor TEXT,
                coord_x TEXT,
                coord_y TEXT,
                ano_exercicio TEXT,
                num_versao TEXT,
                idf_reg_regiao_homogenea TEXT,
                area_territorial TEXT,
                area_construida TEXT,
                latitude TEXT,
                longitude TEXT,
                search_inscricao TEXT,
                search_address TEXT
            )
            """
        )

        insert_sql = """
            INSERT INTO cadastro_base (
                num_bloco,
                num_inscricao,
                cod_endloc_logradouro,
                nme_endloc_logradouro,
                num_endloc_endereco,
                num_endloc_unidade,
                nme_endloc_bairro_cdl,
                des_finalidade,
                rh_nome,
                rh_valor,
                coord_x,
                coord_y,
                ano_exercicio,
                num_versao,
                idf_reg_regiao_homogenea,
                area_territorial,
                area_construida,
                latitude,
                longitude,
                search_inscricao,
                search_address
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """

        batch: list[tuple[str, ...]] = []
        total = 0
        with BASE_FILE.open("r", encoding="utf-8", newline="") as handle:
            reader = csv.DictReader(handle, delimiter="|")
            for source_row in reader:
                row = {column: source_row.get(column, "") for column in BASE_COLUMNS}
                search_inscricao = _normalize_text(row["NUM_INSCRICAO"])
                search_address = " ".join(
                    part
                    for part in [
                        _normalize_text(row["NME_ENDLOC_LOGRADOURO"]),
                        _normalize_text(row["NUM_ENDLOC_ENDERECO"]),
                        _normalize_text(row["NUM_ENDLOC_UNIDADE"]),
                    ]
                    if part
                )
                batch.append(
                    (
                        row["NUM_BLOCO"],
                        row["NUM_INSCRICAO"],
                        row["COD_ENDLOC_LOGRADOURO"],
                        row["NME_ENDLOC_LOGRADOURO"],
                        row["NUM_ENDLOC_ENDERECO"],
                        row["NUM_ENDLOC_UNIDADE"],
                        row["NME_ENDLOC_BAIRRO_CDL"],
                        row["DES_FINALIDADE"],
                        row["RH_NOME"],
                        row["RH_VALOR"],
                        row["COORD_X"],
                        row["COORD_Y"],
                        row["ANO_EXERCICIO"],
                        row["NUM_VERSAO"],
                        row["IDF_REG_REGIAO_HOMOGENEA"],
                        row["AREA_TERRITORIAL"],
                        row["AREA_CONSTRUIDA"],
                        row["LATITUDE"],
                        row["LONGITUDE"],
                        search_inscricao,
                        search_address,
                    )
                )
                if len(batch) >= 10000:
                    connection.executemany(insert_sql, batch)
                    total += len(batch)
                    batch.clear()

        if batch:
            connection.executemany(insert_sql, batch)
            total += len(batch)

        connection.execute(
            "CREATE INDEX idx_cadastro_base_inscricao ON cadastro_base(search_inscricao)"
        )
        connection.execute(
            "CREATE INDEX idx_cadastro_base_endereco ON cadastro_base(search_address)"
        )
        connection.commit()
    finally:
        connection.close()

    try:
        temp_db.replace(SQLITE_FILE)
    except PermissionError as exc:
        if temp_db.exists():
            temp_db.unlink(missing_ok=True)
        raise PermissionError(
            "Nao foi possivel substituir cadastro_base.db. Feche a API antes de rodar o rebuild manual."
        ) from exc
    return SQLITE_FILE, total


def search_cadastro_base(mode: str, query: str, limit: int = 20) -> list[CadastroBaseRecord]:
    if mode not in {"inscricao", "endereco"}:
        raise ValueError("Modo de busca invalido.")

    cleaned_query = _normalize_text(query)
    if len(cleaned_query) < 2:
        return []

    ensure_cadastro_base_sqlite()

    with _connect_sqlite() as connection:
        if mode == "inscricao":
            rows = connection.execute(
                """
                SELECT
                    num_bloco,
                    num_inscricao,
                    cod_endloc_logradouro,
                    nme_endloc_logradouro,
                    num_endloc_endereco,
                    num_endloc_unidade,
                    nme_endloc_bairro_cdl,
                    des_finalidade,
                    rh_nome,
                    rh_valor,
                    coord_x,
                    coord_y,
                    ano_exercicio,
                    num_versao,
                    idf_reg_regiao_homogenea,
                    area_territorial,
                    area_construida,
                    latitude,
                    longitude
                FROM cadastro_base
                WHERE search_inscricao LIKE ?
                LIMIT ?
                """,
                (f"%{cleaned_query}%", limit),
            ).fetchall()
        else:
            terms = [term for term in cleaned_query.split() if term]
            where_clause = " AND ".join(["search_address LIKE ?"] * len(terms))
            params = [f"%{term}%" for term in terms]
            params.append(limit)
            rows = connection.execute(
                f"""
                SELECT
                    num_bloco,
                    num_inscricao,
                    cod_endloc_logradouro,
                    nme_endloc_logradouro,
                    num_endloc_endereco,
                    num_endloc_unidade,
                    nme_endloc_bairro_cdl,
                    des_finalidade,
                    rh_nome,
                    rh_valor,
                    coord_x,
                    coord_y,
                    ano_exercicio,
                    num_versao,
                    idf_reg_regiao_homogenea,
                    area_territorial,
                    area_construida,
                    latitude,
                    longitude
                FROM cadastro_base
                WHERE {where_clause}
                LIMIT ?
                """,
                params,
            ).fetchall()

    return [_to_record(dict(row)) for row in rows]
