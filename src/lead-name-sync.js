const GENERIC_LEAD = /^lead\s*#\s*\d+$/i;
const GENERIC_CONTACT = /^(?:lead|contato|cliente|whatsapp|desconhecido|sem nome|unknown)(?:\s*#?\s*\d+)?$/i;

export function trustedContactName(value) {
  if (typeof value !== "string") return null;
  const name = value.trim().replace(/\s+/g, " ");
  if (name.length < 3 || name.length > 120 || !/\p{L}/u.test(name) ||
      GENERIC_CONTACT.test(name) || /^\+?[\d\s().-]+$/.test(name) ||
      /[<>\r\n]/.test(name)) return null;
  return name;
}

export async function syncGenericLeadName(kommo, leadId) {
  if (!Number.isSafeInteger(leadId) || leadId <= 0) return { status: "invalid_id" };
  const lead = await kommo.getLeadWithContacts(leadId);
  if (!lead || !GENERIC_LEAD.test(String(lead.name || "").trim())) {
    return { status: "not_generic" };
  }
  const contacts = lead._embedded?.contacts || [];
  const main = contacts.find((contact) => contact.is_main) ||
    (contacts.length === 1 ? contacts[0] : null);
  if (!Number.isSafeInteger(main?.id)) return { status: "no_primary_contact" };

  const contact = await kommo.getContact(main.id);
  const name = trustedContactName(contact?.name);
  if (!name) return { status: "untrusted_contact_name" };

  // Recheck immediately before writing, so a human rename is not overwritten.
  const current = await kommo.getLead(leadId);
  if (!GENERIC_LEAD.test(String(current?.name || "").trim())) {
    return { status: "changed_since_read" };
  }
  await kommo.updateLead(leadId, { name });
  return { status: "renamed" };
}

