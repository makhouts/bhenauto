CREATE INDEX "Contact_read_createdAt_id_idx" ON "Contact"("read", "createdAt" DESC, "id");
CREATE INDEX "Appointment_status_date_timeSlot_id_idx" ON "Appointment"("status", "date", "timeSlot", "id");
