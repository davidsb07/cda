from datetime import datetime
from io import BytesIO
from pathlib import Path

import pandas as pd
from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from . import crud, models, schemas
from .cadastro_base import ensure_cadastro_base_sqlite, search_cadastro_base
from .database import BASE_DIR, Base, engine, ensure_property_schema, get_db


Base.metadata.create_all(bind=engine)
ensure_property_schema()
RESULTS_DIR = BASE_DIR / "data" / "results"
RESULTS_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(
    title="Cadastro Imobiliario API",
    version="0.1.0",
    description="API inicial para cadastro e importacao de dados imobiliarios.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def prepare_cadastro_base():
    ensure_cadastro_base_sqlite()


@app.get("/health")
def healthcheck():
    return {"status": "ok"}


@app.get("/properties", response_model=list[schemas.PropertyRead])
def get_properties(db: Session = Depends(get_db)):
    return crud.list_properties(db)


@app.post("/properties", response_model=schemas.PropertyRead, status_code=201)
def post_property(payload: schemas.PropertyCreate, db: Session = Depends(get_db)):
    return crud.create_property(db, payload)


@app.delete("/properties/{property_id}", status_code=204)
def delete_property(property_id: int, db: Session = Depends(get_db)):
    deleted = crud.delete_property(db, property_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Registro nao encontrado.")


@app.get("/properties/export")
def export_properties(db: Session = Depends(get_db)):
    rows = crud.export_properties(db)
    file_name = f"cadastro_imobiliario_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    file_path = RESULTS_DIR / file_name

    df = pd.DataFrame(rows)
    if df.empty:
        df = pd.DataFrame(
            columns=[
                "id",
                "num_bloco",
                "num_inscricao",
                "cod_endloc_logradouro",
                "logradouro",
                "numero",
                "unidade",
                "bairro",
                "finalidade",
                "rh_nome",
                "rh_valor",
                "area_total",
                "area_privativa",
                "finalidade_oferta",
                "area_total_oferta",
                "area_privativa_oferta",
                "valor_oferta",
                "latitude",
                "longitude",
                "descricao_oferta",
                "observacao",
                "url",
                "imobiliaria",
                "codigo",
                "infra",
                "padrao",
                "conservacao",
                "vaga",
            ]
        )
    df.to_excel(file_path, index=False)

    return FileResponse(
        path=Path(file_path),
        filename=file_name,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


@app.get("/cadastro-base/search", response_model=schemas.CadastroBaseSearchResponse)
def get_cadastro_base_search(mode: str, q: str, limit: int = 20):
    try:
        items = search_cadastro_base(mode=mode, query=q, limit=limit)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return schemas.CadastroBaseSearchResponse(mode=mode, total=len(items), items=items)


@app.post("/properties/import-preview", response_model=schemas.SpreadsheetPreview)
async def import_preview(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Arquivo invalido.")

    content = await file.read()
    suffix = file.filename.lower()

    try:
        if suffix.endswith(".csv"):
            df = pd.read_csv(BytesIO(content))
        elif suffix.endswith(".xlsx") or suffix.endswith(".xls"):
            df = pd.read_excel(BytesIO(content))
        else:
            raise HTTPException(status_code=400, detail="Formato nao suportado. Use CSV ou XLSX.")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Falha ao ler planilha: {exc}") from exc

    df = df.where(pd.notnull(df), None)
    preview_rows = df.head(10).to_dict(orient="records")

    return schemas.SpreadsheetPreview(
        file_name=file.filename,
        columns=[str(column) for column in df.columns.tolist()],
        rows=preview_rows,
        total_rows=len(df),
    )
