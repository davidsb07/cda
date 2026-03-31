---
title: cda
emoji: 🏢
colorFrom: red
colorTo: blue
sdk: docker
app_port: 7860
---

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

- `backend/data/base/AUXILIAR_INSCRICOES.txt`: base cadastral bruta, somente leitura
- `backend/data/base/cadastro_base.db`: base otimizada em SQLite, gerada automaticamente a partir do TXT
- `backend/data/results/`: area reservada para planilhas e arquivos gerados pelo sistema

## Atualizacao da base cadastral

Quando o `AUXILIAR_INSCRICOES.txt` for atualizado, o sistema recria automaticamente o `cadastro_base.db` na proxima inicializacao da API.

Se quiser forcar a reconstrucao manualmente:

```powershell
cd backend
.\.venv\Scripts\python.exe scripts\rebuild_cadastro_base.py
```

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

## Deploy no Hugging Face Space

O projeto esta preparado para rodar em `Docker Space`, com o frontend buildado e servido pelo backend em porta unica.

- Space: `https://huggingface.co/spaces/ESJL/cda`
- Porta exposta no container: `7860`
- Arquivo principal de deploy: `Dockerfile`

## Proximos passos

- Ajustar o layout da planilha que voce vai enviar
- Adicionar mais campos do cadastro
- Implementar validacoes de negocio
- Criar autenticacao e perfis, se necessario
