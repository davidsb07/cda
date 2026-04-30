import type {
  CadastroBaseSearchResponse,
  Property,
  PropertyDraft,
  SpreadsheetPreview
} from "./types";

const API_URL = window.location.port === "5173" ? "http://localhost:8001" : "";

export async function fetchProperties(): Promise<Property[]> {
  const response = await fetch(`${API_URL}/properties`);
  if (!response.ok) {
    throw new Error("Falha ao carregar imoveis.");
  }
  return response.json();
}

export async function createProperty(payload: PropertyDraft): Promise<Property> {
  const response = await fetch(`${API_URL}/properties`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Falha ao salvar imovel.");
  }

  return response.json();
}

export async function deleteProperty(propertyId: number): Promise<void> {
  const response = await fetch(`${API_URL}/properties/${propertyId}`, {
    method: "DELETE"
  });

  if (!response.ok) {
    throw new Error("Falha ao excluir registro.");
  }
}

export async function previewSpreadsheet(file: File): Promise<SpreadsheetPreview> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/properties/import-preview`, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Falha ao ler planilha.");
  }

  return response.json();
}

export async function searchCadastroBase(
  mode: "inscricao" | "endereco",
  query: string
): Promise<CadastroBaseSearchResponse> {
  const params = new URLSearchParams({ mode, q: query, limit: "20" });
  const response = await fetch(`${API_URL}/cadastro-base/search?${params.toString()}`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Falha ao consultar base cadastral.");
  }

  return response.json();
}

export function getExportUrl(): string {
  return `${API_URL}/properties/export`;
}
