import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { authTables } from '@convex-dev/auth/server';

const applicationTables = {
  semester: defineTable({
    displayName: v.string(),
    advisorId: v.id('users'),
    startDate: v.number(),  // seconds since epoch
    endDate: v.number(),  // seconds since epoch
  }).index('by_advisor', ['advisorId'])
    .index('by_start_date', ['startDate']),

  timeSlot: defineTable({
    semesterId: v.id('semester'),
    startDateTime: v.number(),  // seconds since epoch
    endDateTime: v.number(),  // seconds since epoch
  }).index('by_semester', ['semesterId'])
    .index('by_start_date_time', ['startDateTime'])
    .index('by_semester_and_start_date_time', ['semesterId', 'startDateTime']),

  student: defineTable({
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    advisorId: v.id('users'),
  }).index('by_advisor', ['advisorId']),

  meeting: defineTable({
    studentId: v.id('student'),
    semesterId: v.id('semester'),
    timeSlotId: v.optional(v.id('timeSlot')),
    secretCode: v.string(),
  }).index('by_student', ['studentId'])
    .index('by_semester', ['semesterId'])
    .index('by_time_slot', ['timeSlotId'])
    .index('by_secret_code', ['secretCode'])
    .index('by_student_semester_and_slot', ['studentId', 'semesterId', 'timeSlotId']),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
