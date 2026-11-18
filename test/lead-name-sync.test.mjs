import assert from "node:assert/strict";
import test from "node:test";
import { syncGenericLeadName, trustedContactName } from "../src/lead-name-sync.js";

test("rejects placeholders and numeric names", () => {
  for (const value of ["Lead #24846015", "Contato 123", "+55 27 99911-5937", "  "]) {
    assert.equal(trustedContactName(value), null);
  }
  assert.equal(trustedContactName("  Ana   Maria  "), "Ana Maria");
});

test("renames only a generic lead using its main contact", async () => {
  const writes = [];
  const kommo = {
    getLeadWithContacts: async () => ({ name: "Lead #24846015", _embedded: { contacts: [
      { id: 1, is_main: false }, { id: 2, is_main: true }
    ] } }),
    getContact: async (id) => ({ name: id === 2 ? "Ana Maria" : "Wrong" }),
    getLead: async () => ({ name: "Lead #24846015" }),
    updateLead: async (id, body) => writes.push({ id, body })
  };
  assert.deepEqual(await syncGenericLeadName(kommo, 24846015), { status: "renamed" });
  assert.deepEqual(writes, [{ id: 24846015, body: { name: "Ana Maria" } }]);
});

test("does not overwrite a changed title or use an untrusted contact", async () => {
  let writes = 0;
  const kommo = {
    getLeadWithContacts: async () => ({ name: "Lead #123", _embedded: { contacts: [{ id: 2, is_main: true }] } }),
    getContact: async () => ({ name: "Ana Maria" }),
    getLead: async () => ({ name: "Sala privada - Ana" }),
    updateLead: async () => { writes += 1; }
  };
  assert.deepEqual(await syncGenericLeadName(kommo, 123), { status: "changed_since_read" });
  kommo.getContact = async () => ({ name: "Contato 123" });
  assert.deepEqual(await syncGenericLeadName(kommo, 123), { status: "untrusted_contact_name" });
  assert.equal(writes, 0);
});

