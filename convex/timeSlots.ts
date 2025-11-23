import { ConvexError, v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getLoggedInAdvisor } from "./auth";
import { DateTime } from "luxon";
import { _requireSemester } from "./semesters";

export const create = mutation({
  args: {
    start: v.number(),  // seconds since epoch
    semesterId: v.optional(v.id('semester')),
  },
  handler: async (ctx, args) => {
    const advisor = await getLoggedInAdvisor(ctx);
    if (!advisor) {
      throw new ConvexError('You must be an advisor to create a time slot');
    }

    const semester = await _requireSemester(ctx, args.semesterId
      ? { semesterId: args.semesterId }
      : { advisorId: advisor._id }
    )

    const slotStart = DateTime.fromSeconds(args.start, { zone: 'utc' });
    if (!slotStart.isValid) {
      throw new ConvexError('Start date is invalid');
    }
    const semesterStart = DateTime.fromSeconds(semester.startDate, { zone: 'utc' });
    if (slotStart.valueOf() < semesterStart.valueOf()) {
      throw new ConvexError('Slot cannot start before semester starts');
    }

    const slotEnd = slotStart.plus({ minutes: 15 });
    const semesterEnd = DateTime.fromSeconds(semester.endDate, { zone: 'utc' });
    if (slotEnd.valueOf() > semesterEnd.valueOf()) {
      throw new ConvexError('Slot cannot end after semester ends');
    }

    const overlappingSlot = await ctx.db.query('timeSlot')
      .filter(q => q.eq(q.field('semesterId'), semester._id))
      .filter(q => q.gt(q.field('endDateTime'), slotStart.toSeconds()))
      .filter(q => q.lt(q.field('startDateTime'), slotEnd.toSeconds()))
      .first()
    if (overlappingSlot) {
      throw new ConvexError('New slot overlaps with existing slot')
    }

    return await ctx.db.insert('timeSlot', {
      semesterId: semester._id,
      startDateTime: slotStart.toSeconds(),
      endDateTime: slotEnd.toSeconds(),
    });
  }
})

export const listForAdvisor = query({
  args: {
    semesterId: v.optional(v.id('semester')),
  },
  handler: async (ctx, args) => {
    const advisor = await getLoggedInAdvisor(ctx);
    if (!advisor) {
      throw new ConvexError('You must be an advisor to create a time slot');
    }

    const semester = await _requireSemester(ctx, args.semesterId
      ? { semesterId: args.semesterId }
      : { advisorId: advisor._id }
    )

    const slots = await ctx.db.query('timeSlot')
      .filter(q => q.eq(q.field('semesterId'), semester._id))
      .collect()

    slots.sort((a, b) => a.startDateTime - b.startDateTime)

    return slots;
  }
})

const listForStudent = query({
  args: {
    meetingId: v.id('meeting'),
    secretCode: v.string(),
  },
  handler: async (ctx, args) => {
    const meeting = await ctx.db.get(args.meetingId);
    if (!meeting) {
      throw new ConvexError('Could not find meeting');
    }

    if (meeting.secretCode !== args.secretCode) {
      throw new ConvexError('Invalid secret code');
    }

    if (meeting.timeSlotId) {
      const slot = await ctx.db.get(meeting.timeSlotId);
      if (!slot) {
        throw new ConvexError('Could not find selected time slot for meeting');
      }

      return [slot]
    }

    const [existingMeetings, allSlots] = await Promise.all([
      ctx.db.query('meeting')
        .filter(q => q.eq(q.field('semesterId'), meeting.semesterId))
        .filter(q => q.neq(q.field('_id'), meeting._id))
        .collect(),
      ctx.db.query('timeSlot')
        .filter(q => q.eq(q.field('semesterId'), meeting.semesterId))
        .collect()
    ])

    const reservedSlotIds = existingMeetings
      .map(meeting => meeting.timeSlotId)
      .filter(id => id != null)

    return allSlots.filter(slot => !reservedSlotIds.includes(slot._id))
  }
})

export const deleteOne = mutation({
  args: {
    timeSlotId: v.id("timeSlot"),
  },
  handler: async (ctx, args) => {
    const advisor = await getLoggedInAdvisor(ctx);
    if (!advisor) {
      throw new ConvexError('You must be an advisor to delete a time slot');
    }

    const timeSlot = await ctx.db.get(args.timeSlotId);
    if (!timeSlot) {
      throw new ConvexError("Time slot not found");
    }

    const semester = await ctx.db.get(timeSlot.semesterId);
    if (!semester) {
      throw new ConvexError('Time slot does not have an associated semester')
    }

    if (semester.advisorId !== advisor._id) {
      throw new ConvexError('You cannot delete time slots you did not create');
    }

    const meeting = await ctx.db.query('meeting')
      .filter(q => q.eq(q.field('timeSlotId'), timeSlot._id))
      .first()
    if (meeting) {
      throw new ConvexError('Cannot delete a time slot with an associated meeting');
    }

    await ctx.db.delete(args.timeSlotId);
  },
});
