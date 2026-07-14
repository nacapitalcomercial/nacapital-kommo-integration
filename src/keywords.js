const PRODUCT_MAP = [
  {
    product: "Escritorio Virtual",
    pipelineKey: "escritorioVirtual",
    keywords: [
      "escritorio virtual",
      "endereco fiscal",
      "endereco comercial",
      "domicilio fiscal",
      "sede fiscal"
    ]
  },
  {
    product: "Eventos",
    pipelineKey: "eventos",
    keywords: ["evento", "workshop", "palestra", "treinamento", "auditorio", "locacao para evento"]
  },
  {
    product: "Avulsos",
    pipelineKey: "avulsos",
    keywords: ["avulso", "por hora", "diaria", "sala de reuniao", "reuniao", "uso pontual"]
  },
  {
    product: "Residencia",
    pipelineKey: "residencia",
    keywords: ["residencia", "moradia", "morar"]
  },
  {
    product: "Coworking",
    pipelineKey: "coworking",
    keywords: ["coworking", "estacao", "mesa", "sala privativa", "sala privada", "hot desk"]
  }
];

export function normalizeText(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function detectProduct(text) {
  const normalized = normalizeText(text);

  for (const entry of PRODUCT_MAP) {
    if (entry.keywords.some((keyword) => normalized.includes(keyword))) {
      return entry;
    }
  }

  return null;
}

export function detectIntent(text) {
  const normalized = normalizeText(text);

  if (/(quero contratar|vamos fechar|fechar agora|seguir com a contratacao|quero assinar|quero iniciar)/.test(normalized)) {
    return "quero_contratar";
  }

  if (/(falar com o time|falar com um consultor|falar com atendente|falar com humano|falar com uma pessoa|quero falar com o time)/.test(normalized)) {
    return "falar_com_time";
  }

  if (/(pronto para fechar|quero fechar|pode fechar|quero comprar|pode contratar|cliente pronto para fechar)/.test(normalized)) {
    return "pronto_para_fechamento";
  }

  if (/(preco|valor|quanto custa|como funciona|disponibilidade|tem vaga|tem horario)/.test(normalized)) {
    return "duvida_comercial";
  }

  if (/(visita|conhecer o espaco|agendar|agenda|quero conhecer|marcar visita)/.test(normalized)) {
    return "agendar_visita";
  }

  return "mensagem_geral";
}
