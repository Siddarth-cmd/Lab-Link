import { z } from "zod";

const uuidSchema = z.string().uuid();

export const createProjectSchema = z.object({
  departmentId: uuidSchema,
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(4000),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().refine((value) => {
    if (!value) return true;
    const date = new Date(`${value}T00:00:00.000Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value && value >= new Date().toISOString().slice(0, 10);
  }, "Choose a valid future project deadline."),
}).strict();

export const createBookingRequestSchema = z.object({
  projectId: uuidSchema,
  equipmentId: uuidSchema,
  startsAt: z.string().datetime({ offset: true }),
  endsAt: z.string().datetime({ offset: true }),
  purpose: z.string().trim().min(20).max(2000),
}).strict().superRefine((request, context) => {
  const start = Date.parse(request.startsAt);
  const end = Date.parse(request.endsAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    context.addIssue({ code: "custom", path: ["endsAt"], message: "End time must be after start time." });
    return;
  }
  if (start <= Date.now()) {
    context.addIssue({ code: "custom", path: ["startsAt"], message: "Choose a future time slot." });
  }
  if (end - start > 8 * 60 * 60 * 1000) {
    context.addIssue({ code: "custom", path: ["endsAt"], message: "A booking request cannot exceed 8 hours." });
  }
});

export const reviewBookingSchema = z.object({
  decision: z.enum(["approved", "rejected", "changes_requested"]),
  note: z.string().trim().max(1000).optional().default(""),
}).strict();

export const createEquipmentSchema = z.object({
  departmentId: uuidSchema,
  name: z.string().trim().min(2).max(160),
  category: z.string().trim().min(2).max(80),
  labName: z.string().trim().min(2).max(160),
  building: z.string().trim().min(2).max(120),
  floor: z.string().trim().min(1).max(80),
  description: z.string().trim().max(4000).default(""),
  specifications: z.record(z.string().trim().min(1).max(120), z.string().trim().min(1).max(300)).default({}),
}).strict();

export const createShowcaseBookingSchema = z.object({
  submissionKey: uuidSchema,
  cancelToken: uuidSchema,
  equipmentId: uuidSchema,
  studentId: uuidSchema,
  projectId: uuidSchema,
  startsAt: z.string().datetime({ offset: true }),
  endsAt: z.string().datetime({ offset: true }),
  purpose: z.string().trim().min(20).max(500),
}).strict().superRefine((request, context) => {
  const start = Date.parse(request.startsAt);
  const end = Date.parse(request.endsAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start <= Date.now() || end <= start || end - start > 8 * 60 * 60 * 1000) {
    context.addIssue({ code: "custom", path: ["endsAt"], message: "Choose a future time range of up to 8 hours." });
  }
});

export const createShowcaseProjectSchema = z.object({
  submissionKey: uuidSchema,
  studentId: uuidSchema,
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(1000),
  deadline: z.string().date(),
}).strict().superRefine((project, context) => {
  if (project.deadline < new Date().toISOString().slice(0, 10)) {
    context.addIssue({ code: "custom", path: ["deadline"], message: "Choose today or a future project deadline." });
  }
});

export const reviewShowcaseBookingSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  note: z.string().trim().max(1000).optional().default(""),
}).strict();

export const cancelShowcaseBookingSchema = z.object({ cancelToken: uuidSchema }).strict();
