from pathlib import Path
import sys

BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from app.cadastro_base import ensure_cadastro_base_sqlite


if __name__ == "__main__":
    db_path, row_count = ensure_cadastro_base_sqlite(force_rebuild=True)
    print(f"Base SQLite atualizada: {db_path} ({row_count} registros)")
