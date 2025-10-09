import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createMeeting = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    duration: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to create meetings");
    }

    const meetingId = await ctx.db.insert("meetings", {
      title: args.title,
      description: args.description,
      duration: args.duration,
      createdBy: userId,
      isActive: true,
    });

    return meetingId;
  },
});

export const getUserMeetings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const meetings = await ctx.db
      .query("meetings")
      .withIndex("by_creator", (q) => q.eq("createdBy", userId))
      .collect();

    // Get booking counts for each meeting
    const meetingsWithDetails = await Promise.all(
      meetings.map(async (meeting) => {
        const bookings = await ctx.db
          .query("bookings")
          .withIndex("by_meeting", (q) => q.eq("meetingId", meeting._id))
          .filter((q) => q.eq(q.field("status"), "confirmed"))
          .collect();

        // Get available time slots for this meeting duration
        const availableSlots = await ctx.db
          .query("timeSlots")
          .withIndex("by_duration", (q) => q.eq("duration", meeting.duration))
          .filter((q) => 
            q.and(
              q.eq(q.field("createdBy"), userId),
              q.eq(q.field("isActive"), true)
            )
          )
          .collect();

        return {
          ...meeting,
          bookingCount: bookings.length,
          availableSlotCount: availableSlots.length,
        };
      })
    );

    return meetingsWithDetails;
  },
});

export const getMeeting = query({
  args: { meetingId: v.id("meetings") },
  handler: async (ctx, args) => {
    const meeting = await ctx.db.get(args.meetingId);
    if (!meeting || !meeting.isActive) {
      return null;
    }

    // Get available time slots for this meeting duration
    const availableSlots = await ctx.db
      .query("timeSlots")
      .withIndex("by_duration", (q) => q.eq("duration", meeting.duration))
      .filter((q) => 
        q.and(
          q.eq(q.field("createdBy"), meeting.createdBy),
          q.eq(q.field("isActive"), true)
        )
      )
      .collect();

    // Get all bookings for this meeting
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_meeting", (q) => q.eq("meetingId", args.meetingId))
      .filter((q) => q.eq(q.field("status"), "confirmed"))
      .collect();

    const userId = await getAuthUserId(ctx);
    const userBooking = bookings.find(b => b.bookedBy === userId);

    let userBookedSlot = null;
    if (userBooking) {
      userBookedSlot = await ctx.db.get(userBooking.timeSlotId);
    }

    return {
      ...meeting,
      availableSlots,
      bookedSlotIds: bookings.map(b => b.timeSlotId),
      userBookedSlot,
    };
  },
});

export const bookSlot = mutation({
  args: {
    meetingId: v.id("meetings"),
    timeSlotId: v.id("timeSlots"),
    bookerName: v.optional(v.string()),
    bookerEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const meeting = await ctx.db.get(args.meetingId);
    if (!meeting || !meeting.isActive) {
      throw new Error("Meeting not found or inactive");
    }

    const timeSlot = await ctx.db.get(args.timeSlotId);
    if (!timeSlot || !timeSlot.isActive) {
      throw new Error("Time slot not found or inactive");
    }

    // Verify time slot duration matches meeting duration
    if (timeSlot.duration !== meeting.duration) {
      throw new Error("Time slot duration doesn't match meeting duration");
    }

    // Verify time slot belongs to meeting creator
    if (timeSlot.createdBy !== meeting.createdBy) {
      throw new Error("Time slot not available for this meeting");
    }

    const userId = await getAuthUserId(ctx);

    // Check if slot is already booked for this meeting
    const existingBooking = await ctx.db
      .query("bookings")
      .withIndex("by_meeting_and_slot", (q) => 
        q.eq("meetingId", args.meetingId).eq("timeSlotId", args.timeSlotId)
      )
      .filter((q) => q.eq(q.field("status"), "confirmed"))
      .first();

    if (existingBooking) {
      throw new Error("This time slot is already booked for this meeting");
    }

    // Check if user already has a booking for this meeting
    if (userId) {
      const userExistingBooking = await ctx.db
        .query("bookings")
        .withIndex("by_meeting", (q) => q.eq("meetingId", args.meetingId))
        .filter((q) => 
          q.and(
            q.eq(q.field("bookedBy"), userId),
            q.eq(q.field("status"), "confirmed")
          )
        )
        .first();

      if (userExistingBooking) {
        throw new Error("You already have a booking for this meeting");
      }
    }

    const bookingId = await ctx.db.insert("bookings", {
      meetingId: args.meetingId,
      timeSlotId: args.timeSlotId,
      bookedBy: userId || undefined,
      bookerName: args.bookerName,
      bookerEmail: args.bookerEmail,
      status: "confirmed",
    });

    return bookingId;
  },
});

export const cancelBooking = mutation({
  args: {
    meetingId: v.id("meetings"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to cancel booking");
    }

    const booking = await ctx.db
      .query("bookings")
      .withIndex("by_meeting", (q) => q.eq("meetingId", args.meetingId))
      .filter((q) => 
        q.and(
          q.eq(q.field("bookedBy"), userId),
          q.eq(q.field("status"), "confirmed")
        )
      )
      .first();

    if (!booking) {
      throw new Error("No booking found to cancel");
    }

    await ctx.db.patch(booking._id, { status: "cancelled" });
  },
});

export const toggleMeetingStatus = mutation({
  args: {
    meetingId: v.id("meetings"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    const meeting = await ctx.db.get(args.meetingId);
    if (!meeting) {
      throw new Error("Meeting not found");
    }

    if (meeting.createdBy !== userId) {
      throw new Error("Not authorized to modify this meeting");
    }

    await ctx.db.patch(args.meetingId, {
      isActive: !meeting.isActive,
    });
  },
});
