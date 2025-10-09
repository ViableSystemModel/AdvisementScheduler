import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createTimeSlot = mutation({
  args: {
    start: v.string(),
    end: v.string(),
    duration: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to create time slots");
    }

    // Check if slot already exists
    const existingSlot = await ctx.db
      .query("timeSlots")
      .withIndex("by_start_time", (q) => q.eq("start", args.start))
      .filter((q) => q.eq(q.field("createdBy"), userId))
      .first();

    if (existingSlot) {
      throw new Error("Time slot already exists");
    }

    const slotId = await ctx.db.insert("timeSlots", {
      start: args.start,
      end: args.end,
      duration: args.duration,
      createdBy: userId,
      isActive: true,
    });

    return slotId;
  },
});

export const getUserTimeSlots = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const timeSlots = await ctx.db
      .query("timeSlots")
      .withIndex("by_creator", (q) => q.eq("createdBy", userId))
      .collect();

    // Get booking counts for each time slot
    const timeSlotsWithBookings = await Promise.all(
      timeSlots.map(async (slot) => {
        const bookings = await ctx.db
          .query("bookings")
          .withIndex("by_time_slot", (q) => q.eq("timeSlotId", slot._id))
          .filter((q) => q.eq(q.field("status"), "confirmed"))
          .collect();

        return {
          ...slot,
          bookingCount: bookings.length,
          isBooked: bookings.length > 0,
        };
      })
    );

    return timeSlotsWithBookings.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  },
});

export const toggleTimeSlotStatus = mutation({
  args: {
    timeSlotId: v.id("timeSlots"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    const timeSlot = await ctx.db.get(args.timeSlotId);
    if (!timeSlot) {
      throw new Error("Time slot not found");
    }

    if (timeSlot.createdBy !== userId) {
      throw new Error("Not authorized to modify this time slot");
    }

    await ctx.db.patch(args.timeSlotId, {
      isActive: !timeSlot.isActive,
    });
  },
});

export const deleteTimeSlot = mutation({
  args: {
    timeSlotId: v.id("timeSlots"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    const timeSlot = await ctx.db.get(args.timeSlotId);
    if (!timeSlot) {
      throw new Error("Time slot not found");
    }

    if (timeSlot.createdBy !== userId) {
      throw new Error("Not authorized to delete this time slot");
    }

    // Check if time slot is used in any bookings
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_time_slot", (q) => q.eq("timeSlotId", args.timeSlotId))
      .filter((q) => q.eq(q.field("status"), "confirmed"))
      .collect();

    if (bookings.length > 0) {
      throw new Error("Cannot delete time slot with existing bookings");
    }

    await ctx.db.delete(args.timeSlotId);
  },
});
