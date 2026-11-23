import assert from "node:assert/strict";
import { test } from "node:test";
import { createBookingRequestSchema, createEquipmentSchema, createProjectSchema, createShowcaseBookingSchema, createShowcaseProjectSchema, reviewBookingSchema, reviewShowcaseBookingSchema } from "../lib/validation/requests";

const id = "f59f8f08-a9de-4dc4-9f07-9177be28e8ae";
const validSlot = () => { const start = new Date(Date.now() + 48 * 60 * 60 * 1000); return { startsAt: start.toISOString(), endsAt: new Date(start.getTime() + 2 * 60 * 60 * 1000).toISOString() }; };

test("project request trims text and rejects short descriptions", () => {
  const parsed = createProjectSchema.safeParse({ departmentId: id, title: "  Sensor study  ", description: "  Testing new sensors  " });
  assert.equal(parsed.success, true);
  if (parsed.success) assert.equal(parsed.data.title, "Sensor study");
  assert.equal(createProjectSchema.safeParse({ departmentId: id, title: "x", description: "short" }).success, false);
});

test("booking request requires a future, ordered slot no longer than eight hours", () => {
  const slot = validSlot();
  const valid = { projectId: id, equipmentId: id, ...slot, purpose: "Characterize the surface of three samples." };
  assert.equal(createBookingRequestSchema.safeParse(valid).success, true);
  assert.equal(createBookingRequestSchema.safeParse({ ...valid, endsAt: slot.startsAt }).success, false);
  assert.equal(createBookingRequestSchema.safeParse({ ...valid, startsAt: new Date(Date.now() - 1000).toISOString() }).success, false);
  assert.equal(createBookingRequestSchema.safeParse({ ...valid, endsAt: new Date(Date.parse(slot.startsAt) + 9 * 60 * 60 * 1000).toISOString() }).success, false);
});

test("faculty review accepts only supported decisions and bounded notes", () => {
  assert.equal(reviewBookingSchema.safeParse({ decision: "approved", note: "Safety training verified." }).success, true);
  assert.equal(reviewBookingSchema.safeParse({ decision: "owner", note: "" }).success, false);
  assert.equal(reviewBookingSchema.safeParse({ decision: "approved", note: "x".repeat(1001) }).success, false);
});

test("equipment additions require bounded metadata and department identifiers", () => {
  const input = { departmentId: id, name: "Thermal Camera", category: "Imaging", labName: "Thermal Lab", building: "Engineering", floor: "2", description: "Infrared imaging instrument", specifications: { "Resolution": "640 x 480" } };
  assert.equal(createEquipmentSchema.safeParse(input).success, true);
  assert.equal(createEquipmentSchema.safeParse({ ...input, name: "x" }).success, false);
  assert.equal(createEquipmentSchema.safeParse({ ...input, specifications: { x: "" } }).success, false);
});

test("public showcase project requires a stable key, known profile id shape, and deadline", () => {
  const project = { submissionKey: id, studentId: id, title: "Robot navigation", description: "Build and test a rover in the indoor test arena.", deadline: new Date(Date.now() + 86400000 * 20).toISOString().slice(0,10) };
  assert.equal(createShowcaseProjectSchema.safeParse(project).success, true);
  assert.equal(createShowcaseProjectSchema.safeParse({ ...project, title: "x" }).success, false);
  assert.equal(createShowcaseProjectSchema.safeParse({ ...project, deadline: "not-a-date" }).success, false);
});

test("showcase booking validates time, purpose, identifiers, and decision enum", () => {
  const booking = { submissionKey: id, cancelToken: id, studentId: id, projectId: id, equipmentId: id, ...validSlot(), purpose: "Capture calibration samples for the project." };
  assert.equal(createShowcaseBookingSchema.safeParse(booking).success, true);
  assert.equal(createShowcaseBookingSchema.safeParse({ ...booking, endsAt: booking.startsAt }).success, false);
  assert.equal(createShowcaseBookingSchema.safeParse({ ...booking, purpose: "short" }).success, false);
  assert.equal(reviewShowcaseBookingSchema.safeParse({ decision: "approved" }).success, true);
  assert.equal(reviewShowcaseBookingSchema.safeParse({ decision: "changes_requested" }).success, false);
});
