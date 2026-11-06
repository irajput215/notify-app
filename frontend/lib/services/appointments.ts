import type { AppointmentStatus } from "@/lib/types";
import { request } from "./client";
import { db, findOrThrow } from "./db";
import { patchAppointment } from "./internal";

/** GET /clinic/appointments (proxied from Cliniko) */
export const listAppointments = () => request(() => db().appointments);

/** PATCH /clinic/appointments/:id/status */
export const setAppointmentStatus = (id: string, status: AppointmentStatus) =>
  request(() => patchAppointment(findOrThrow(db().appointments, id, "Appointment"), { status }, `Status set to ${status} by staff`));
