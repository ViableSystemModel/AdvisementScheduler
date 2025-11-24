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

export const createBulk = mutation({
  args: {
    starts: v.array(v.number()),  // array of seconds since epoch
    semesterId: v.optional(v.id('semester')),
    timezone: v.optional(v.string()),  // IANA timezone string (e.g., 'America/New_York')
  },
  handler: async (ctx, args) => {
    const advisor = await getLoggedInAdvisor(ctx);
    if (!advisor) {
      throw new ConvexError('You must be an advisor to create time slots');
    }

    const semester = await _requireSemester(ctx, args.semesterId
      ? { semesterId: args.semesterId }
      : { advisorId: advisor._id }
    )

    const semesterStart = DateTime.fromSeconds(semester.startDate, { zone: 'utc' });
    const semesterEnd = DateTime.fromSeconds(semester.endDate, { zone: 'utc' });

    // Validate all slots first
    const slotsToCreate = [];
    for (const start of args.starts) {
      const slotStart = DateTime.fromSeconds(start, { zone: 'utc' });
      if (!slotStart.isValid) {
        throw new ConvexError('One or more start times are invalid');
      }

      if (slotStart.valueOf() < semesterStart.valueOf()) {
        throw new ConvexError(`Slot at ${slotStart.toISO()} cannot start before semester starts`);
      }

      const slotEnd = slotStart.plus({ minutes: 15 });
      if (slotEnd.valueOf() > semesterEnd.valueOf()) {
        throw new ConvexError(`Slot at ${slotStart.toISO()} cannot end after semester ends`);
      }

      slotsToCreate.push({
        startDateTime: slotStart.toSeconds(),
        endDateTime: slotEnd.toSeconds(),
      });
    }

    // Check for overlaps with existing slots
    const existingSlots = await ctx.db.query('timeSlot')
      .filter(q => q.eq(q.field('semesterId'), semester._id))
      .collect();

    for (const newSlot of slotsToCreate) {
      // Check against existing slots
      const overlapping = existingSlots.find(existing =>
        existing.endDateTime > newSlot.startDateTime &&
        existing.startDateTime < newSlot.endDateTime
      );
      if (overlapping) {
        const overlappingStart = DateTime.fromSeconds(overlapping.startDateTime);
        throw new ConvexError(`New slot overlaps with existing slot at ${overlappingStart.toISO()}`);
      }

      // Check against other new slots
      const selfOverlapping = slotsToCreate.find(other =>
        other !== newSlot &&
        other.endDateTime > newSlot.startDateTime &&
        other.startDateTime < newSlot.endDateTime
      );
      if (selfOverlapping) {
        throw new ConvexError('Some of the selected times overlap with each other');
      }
    }

    // Create all slots
    return await Promise.all(slotsToCreate.map(
      slot => ctx.db.insert('timeSlot', { semesterId: semester._id, ...slot })
    ));
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

    const meetings = await ctx.db.query('meeting')
      .withIndex('by_semester', q => q.eq('semesterId', semester._id))
      .collect();

    const timeSlotToMeetingMap = new Map(
      meetings
        .filter(m => m.timeSlotId !== undefined)
        .map(m => [m.timeSlotId!, m])
    );

    const slotsWithStudent = await Promise.all(slots.map(async (slot) => {
      const meeting = timeSlotToMeetingMap.get(slot._id);
      let student = null;
      if (meeting) {
        student = await ctx.db.get(meeting.studentId);
      }
      return {
        ...slot,
        student,
      };
    }));

    slotsWithStudent.sort((a, b) => a.startDateTime - b.startDateTime)

    return slotsWithStudent;
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
