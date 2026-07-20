import { config } from "./config.js";

function normalizeEnumKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function buildCustomFieldValue(fieldId, value, enumMap = null) {
  if (!fieldId || value == null || value === "") {
    return null;
  }

  const normalizedKey = normalizeEnumKey(value);
  const enumEntry = enumMap?.[normalizedKey] || null;

  return {
    field_id: fieldId,
    values: [
      enumEntry
        ? {
            enum_id: enumEntry.enumId,
            value: enumEntry.value
          }
        : { value }
    ]
  };
}

export class KommoClient {
  async request(path, options = {}) {
    const response = await fetch(`${config.kommo.baseUrl}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${config.kommo.token}`,
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Kommo API error ${response.status}: ${text}`);
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  }

  async getAccount() {
    return this.request("/account");
  }

  async listUsers() {
    return this.request("/users");
  }

  async listPipelines() {
    return this.request("/leads/pipelines");
  }

  async getLead(leadId) {
    return this.request(`/leads/${leadId}`);
  }

  async searchContacts(query) {
    if (!query) {
      return [];
    }

    const result = await this.request(`/contacts?query=${encodeURIComponent(query)}`);
    return result?._embedded?.contacts || [];
  }

  async createLead({
    name,
    pipelineId,
    statusId,
    responsibleUserId,
    tags = [],
    customFields = []
  }) {
    const payload = [
      {
        name,
        pipeline_id: pipelineId || undefined,
        status_id: statusId || undefined,
        responsible_user_id: responsibleUserId || undefined,
        _embedded: tags.length ? { tags: tags.map((tag) => ({ name: tag })) } : undefined,
        custom_fields_values: customFields.filter(Boolean)
      }
    ];

    const result = await this.request("/leads", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    return result?._embedded?.leads?.[0] || null;
  }

  async updateLead(leadId, changes) {
    const payload = [{ id: leadId, ...changes }];
    const result = await this.request("/leads", {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
    return result?._embedded?.leads?.[0] || null;
  }

  async createTask({
    text,
    entityId,
    entityType = "leads",
    responsibleUserId,
    completeTill
  }) {
    const payload = [
      {
        text,
        entity_id: entityId,
        entity_type: entityType,
        responsible_user_id: responsibleUserId || undefined,
        complete_till: completeTill || undefined
      }
    ];

    const result = await this.request("/tasks", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    return result?._embedded?.tasks?.[0] || null;
  }

  async createContact({ name, customFields = [] }) {
    const result = await this.request("/contacts", {
      method: "POST",
      body: JSON.stringify([
        {
          name,
          custom_fields_values: customFields.filter(Boolean)
        }
      ])
    });

    return result?._embedded?.contacts?.[0] || null;
  }

  async addLeadNote(leadId, text) {
    return this.request(`/leads/${leadId}/notes`, {
      method: "POST",
      body: JSON.stringify([
        {
          note_type: "common",
          params: {
            text
          }
        }
      ])
    });
  }

  async attachContactToLead(leadId, contactId) {
    return this.request(`/leads/${leadId}/link`, {
      method: "POST",
      body: JSON.stringify([
        {
          to_entity_id: contactId,
          to_entity_type: "contacts"
        }
      ])
    });
  }

  buildContactFieldMap(values) {
    return [
      buildCustomFieldValue(config.contactFields.phone, values.phone),
      buildCustomFieldValue(config.contactFields.email, values.email),
      buildCustomFieldValue(config.contactFields.qualificacao, values.qualificacao),
      buildCustomFieldValue(config.contactFields.comoNosConheceu, values.comoNosConheceu)
    ].filter(Boolean);
  }

  async findOrCreateContact({ name, phone, email, source }) {
    const searchTerms = [phone, email, name].filter(Boolean);

    for (const term of searchTerms) {
      const contacts = await this.searchContacts(term);
      const match = contacts.find((contact) => {
        const customFields = contact.custom_fields_values || [];
        const allValues = customFields
          .flatMap((field) => field.values || [])
          .map((item) => String(item.value || ""));

        return (
          (phone && allValues.some((value) => value.replace(/[^\d+]/g, "") === phone)) ||
          (email && allValues.some((value) => value.toLowerCase() === String(email).toLowerCase())) ||
          (name && contact.name === name)
        );
      });

      if (match) {
        return match;
      }
    }

    return this.createContact({
      name,
      customFields: this.buildContactFieldMap({
        phone,
        email,
        qualificacao: "Novo lead",
        comoNosConheceu: source
      })
    });
  }

  async ensureLeadContact({ leadId, name, phone, email, source, existingContactId }) {
    if (existingContactId) {
      return { id: existingContactId };
    }

    const contact = await this.findOrCreateContact({ name, phone, email, source });
    if (leadId && contact?.id) {
      await this.attachContactToLead(leadId, contact.id);
    }

    return contact;
  }

  buildLeadFieldMap(values) {
    return [
      buildCustomFieldValue(
        config.customFields.produtoInteresse,
        values.produtoInteresse,
        config.customFieldEnums.produtoInteresse
      ),
      buildCustomFieldValue(
        config.customFields.origemLead,
        values.origemLead,
        config.customFieldEnums.origemLead
      ),
      buildCustomFieldValue(
        config.customFields.canal,
        values.canal,
        config.customFieldEnums.canal
      ),
      buildCustomFieldValue(config.customFields.campanha, values.campanha),
      buildCustomFieldValue(config.customFields.adset, values.adset),
      buildCustomFieldValue(config.customFields.anuncio, values.anuncio),
      buildCustomFieldValue(config.customFields.palavraChave, values.palavraChave),
      buildCustomFieldValue(
        config.customFields.temperaturaLead,
        values.temperaturaLead,
        config.customFieldEnums.temperaturaLead
      ),
      buildCustomFieldValue(
        config.customFields.querContratar,
        values.querContratar,
        config.customFieldEnums.querContratar
      ),
      buildCustomFieldValue(
        config.customFields.querFalarComTime,
        values.querFalarComTime,
        config.customFieldEnums.querFalarComTime
      ),
      buildCustomFieldValue(
        config.customFields.prontoParaFechamento,
        values.prontoParaFechamento,
        config.customFieldEnums.prontoParaFechamento
      ),
      buildCustomFieldValue(config.customFields.documentacaoCompleta, values.documentacaoCompleta),
      buildCustomFieldValue(config.customFields.unidadeInteresse, values.unidadeInteresse),
      buildCustomFieldValue(config.customFields.sdrResponsavel, values.sdrResponsavel),
      buildCustomFieldValue(config.customFields.closerResponsavel, values.closerResponsavel),
      buildCustomFieldValue(config.customFields.dataPrimeiraResposta, values.dataPrimeiraResposta),
      buildCustomFieldValue(config.customFields.dataAgendamento, values.dataAgendamento),
      buildCustomFieldValue(config.customFields.motivoPerda, values.motivoPerda)
    ].filter(Boolean);
  }
}
