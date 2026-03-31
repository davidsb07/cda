# Cadastro Imobiliario

Estrutura inicial para um sistema de cadastro de dados imobiliarios com:

- Backend em FastAPI
- Frontend em React + Vite
- Banco local SQLite para desenvolvimento
- Upload inicial de planilha para preview e importacao futura

## Estrutura

- `backend/`: API e persistencia
- `frontend/`: interface web
- `run-dev.ps1`: sobe backend e frontend em desenvolvimento

## Bases de dados locais

- `backend/data/base/AUXILIAR_INSCRICOES.txt`: base cadastral auxiliar, somente leitura
- `backend/data/results/`: area reservada para planilhas e arquivos gerados pelo sistema

## Campos iniciais

- `titulo`
- `finalidade`
- `area_total`
- `area_privativa`
- `valor`
- `anuncio`
- `origem`
- `observacoes`

## Como rodar

No Windows PowerShell:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\run-dev.ps1
```

Se quiser instalar dependencias automaticamente:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\run-dev.ps1 -Install
```

## URLs padrao

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- Docs da API: `http://localhost:8000/docs`

## Proximos passos

- Ajustar o layout da planilha que voce vai enviar
- Adicionar mais campos do cadastro
- Implementar validacoes de negocio
- Criar autenticacao e perfis, se necessario
