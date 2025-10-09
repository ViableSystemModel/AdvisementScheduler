import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  timeSlots: defineTable({
    start: v.string(), // ISO string
    end: v.string(), // ISO string
    duration: v.number(), // duration in minutes
    createdBy: v.id("users"),
    isActive: v.boolean(),
  }).index("by_creator", ["createdBy"])
    .index("by_start_time", ["start"])
    .index("by_duration", ["duration"]),
  
  meetings: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    duration: v.number(), // duration in minutes
    createdBy: v.id("users"),
    isActive: v.boolean(),
  }).index("by_creator", ["createdBy"])
    .index("by_duration", ["duration"]),
  
  bookings: defineTable({
    meetingId: v.id("meetings"),
    timeSlotId: v.id("timeSlots"),
    bookedBy: v.optional(v.id("users")), // optional for anonymous bookings
    bookerName: v.optional(v.string()),
    bookerEmail: v.optional(v.string()),
    status: v.union(v.literal("confirmed"), v.literal("cancelled")),
  }).index("by_meeting", ["meetingId"])
    .index("by_booker", ["bookedBy"])
    .index("by_time_slot", ["timeSlotId"])
    .index("by_meeting_and_slot", ["meetingId", "timeSlotId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
