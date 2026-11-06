import type { Contact } from "@/lib/types";
import { request } from "./client";
import { db } from "./db";
import { getContact, patchContact } from "./internal";

/** GET /contacts */
export const listContacts = () => request(() => db().contacts);

/** PATCH /contacts/:id */
export const updateContact = (id: string, patch: Partial<Pick<Contact, "tags" | "assignedTo" | "optIn">>) =>
  request(() => patchContact(getContact(id), patch));

/** POST /contacts/import — mock CSV import that pretends to validate rows. */
export const importContacts = (fileName: string) =>
  request(
    () => ({
      fileName,
      rows: 128,
      imported: 119,
      duplicates: 6,
      invalidNumbers: 3,
      withoutConsent: 14,
    }),
    1400,
  );
