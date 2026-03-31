from pathlib import Path

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker


BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
DATABASE_URL = f"sqlite:///{DATA_DIR / 'app.db'}"


class Base(DeclarativeBase):
    pass


engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_property_schema() -> None:
    inspector = inspect(engine)
    if "properties" not in inspector.get_table_names():
        return

    existing_columns = {column["name"] for column in inspector.get_columns("properties")}
    migrations = {
        "num_inscricao": "ALTER TABLE properties ADD COLUMN num_inscricao VARCHAR(30)",
        "nme_endloc_logradouro": "ALTER TABLE properties ADD COLUMN nme_endloc_logradouro VARCHAR(150)",
        "num_endloc_endereco": "ALTER TABLE properties ADD COLUMN num_endloc_endereco VARCHAR(30)",
        "num_endloc_unidade": "ALTER TABLE properties ADD COLUMN num_endloc_unidade VARCHAR(30)",
        "nme_endloc_bairro_cdl": "ALTER TABLE properties ADD COLUMN nme_endloc_bairro_cdl VARCHAR(120)",
        "latitude": "ALTER TABLE properties ADD COLUMN latitude FLOAT",
        "longitude": "ALTER TABLE properties ADD COLUMN longitude FLOAT",
        "finalidade_oferta": "ALTER TABLE properties ADD COLUMN finalidade_oferta VARCHAR(50)",
        "area_total_oferta": "ALTER TABLE properties ADD COLUMN area_total_oferta FLOAT",
        "area_privativa_oferta": "ALTER TABLE properties ADD COLUMN area_privativa_oferta FLOAT",
        "valor_oferta": "ALTER TABLE properties ADD COLUMN valor_oferta FLOAT",
        "descricao_oferta": "ALTER TABLE properties ADD COLUMN descricao_oferta TEXT",
        "observacao": "ALTER TABLE properties ADD COLUMN observacao TEXT",
        "url": "ALTER TABLE properties ADD COLUMN url TEXT",
        "imobiliaria": "ALTER TABLE properties ADD COLUMN imobiliaria VARCHAR(150)",
        "codigo": "ALTER TABLE properties ADD COLUMN codigo VARCHAR(80)",
        "infra": "ALTER TABLE properties ADD COLUMN infra TEXT",
        "padrao": "ALTER TABLE properties ADD COLUMN padrao VARCHAR(80)",
        "vaga": "ALTER TABLE properties ADD COLUMN vaga VARCHAR(80)",
    }

    with engine.begin() as connection:
        for column_name, statement in migrations.items():
            if column_name not in existing_columns:
                connection.execute(text(statement))
