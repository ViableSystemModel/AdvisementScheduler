import { ConvexError, v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getLoggedInAdvisor } from "./auth";
import { _requireSemester } from "./semesters";
import * as b from 'valibot';
import * as uuid from 'uuid'

function createSecretCode() {
  return uuid.v4();
}

export const createMeeting = mutation({
  args: {
    studentId: v.id('student'),
    semesterId: v.optional(v.id('semester')),
  },
  handler: async (ctx, args) => {
    const advisor = await getLoggedInAdvisor(ctx);
    if (!advisor) {
      throw new ConvexError('You must be an advisor to create a meeting')
    }

    const semester = await _requireSemester(ctx, args.semesterId
      ? { semesterId: args.semesterId }
      : { advisorId: advisor._id }
    )

    let secretCode: string;
    do {
      secretCode = createSecretCode()
    } while (
      await ctx.db.query('meeting')
        .withIndex('by_secret_code', q => q.eq('secretCode', secretCode))
        .first()
    )

    return await ctx.db.insert("meeting", {
      studentId: args.studentId,
      semesterId: semester._id,
      secretCode: secretCode,
    });
  },
});

export const getMeeting = query({
  args: { meetingId: v.string() },
  handler: async (ctx, args) => {
    const meeting = await ctx.db.query('meeting')
      .filter(q => q.eq(q.field('secretCode'), args.meetingId))
      .first();
    if (!meeting) {
      return null
    }
    const [student, semester, allMeetings, allSlots] = await Promise.all([
      ctx.db.get(meeting.studentId),
      ctx.db.get(meeting.semesterId),
      ctx.db.query('meeting')
        .filter(q => q.eq(q.field('semesterId'), meeting.semesterId))
        .collect(),
      ctx.db.query('timeSlot')
        .filter(q => q.eq(q.field('semesterId'), meeting.semesterId))
        .collect()
    ])
    if (!student) {
      throw new ConvexError('Student not found')
    }
    if (!semester) {
      throw new ConvexError('Semester not found')
    }

    const advisor = await ctx.db.get(semester.advisorId)
    if (!advisor) {
      throw new ConvexError('Advisor not found')
    }

    const bookedSlots = allMeetings.map(slot => slot.timeSlotId).filter(id => id != null)
    const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot._id) || slot._id === meeting.timeSlotId)

    return {
      ...meeting,
      student,
      semester,
      advisor,
      availableSlots,
    }
  },
});

export const bookMeeting = mutation({
  args: {
    meetingId: v.id("meeting"),
    timeSlotId: v.id("timeSlot"),
    secretCode: v.string(),
    bookerEmail: v.optional(v.string()),
    bookerPhone: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const [meeting, timeSlot] = await Promise.all([
      ctx.db.get(args.meetingId),
      ctx.db.get(args.timeSlotId),
    ]);
    if (!meeting) {
      throw new ConvexError('Meeting not found');
    }
    if (!timeSlot) {
      throw new ConvexError('Time slot not found')
    }
    if (meeting.secretCode !== args.secretCode) {
      throw new ConvexError('Incorrect secret code')
    }
    if (meeting.semesterId !== timeSlot.semesterId) {
      throw new ConvexError('Semesters are mismatched')
    }
    if (meeting.timeSlotId != null) {
      if (meeting.timeSlotId === timeSlot._id) {
        throw new ConvexError('Time slot is already assigned to this meeting')
      } else {
        throw new ConvexError('Another time slot is already assigned to this meeting')
      }
    }

    const patchPromises = [
      ctx.db.patch(meeting._id, { timeSlotId: timeSlot._id })
    ]
    if (args.bookerEmail || args.bookerPhone) {
      const student = await ctx.db.get(meeting.studentId);
      if (!student) {
        throw new ConvexError('Student not found')
      }
      const ContactSchema = b.object({
        email: b.optional(b.pipe(
          b.string(),
          b.email(),
        ), student.email),
        phone: b.optional(b.pipe(
          b.string(),
          b.regex(/^\+?\d{0,3}\s?[(]?\d{3}[)]?[-\s\.]?\d{3}[-\s\.]?\d{4}$/),
          b.transform(phone => phone.replaceAll(/\D/, ''))
        ), student.phone)
      })
      const result = b.safeParse(ContactSchema, {
        email: args.bookerEmail,
        phone: args.bookerPhone,
      })
      if (!result.success) {
        throw new ConvexError(result.issues.pop()?.message ?? 'Unknown error with contact information')
      }
      patchPromises.push(ctx.db.patch(student._id, result.output))
    }
    await Promise.all(patchPromises)
  },
});

export const listForSemester = query({
  args: { semesterId: v.id('semester') },
  handler: async (ctx, args) => {
    const advisor = await getLoggedInAdvisor(ctx);
    if (!advisor) {
      throw new ConvexError('You must be an advisor to view meetings');
    }

    const semester = await ctx.db.get(args.semesterId);
    if (!semester) {
      throw new ConvexError('Semester not found');
    }
    if (semester.advisorId !== advisor._id) {
      throw new ConvexError('You can only view meetings for your own semesters');
    }

    const meetings = await ctx.db.query('meeting')
      .withIndex('by_semester', q => q.eq('semesterId', args.semesterId))
      .collect();

    // Enrich with student and time slot info
    return await Promise.all(meetings.map(async (meeting) => {
      const student = await ctx.db.get(meeting.studentId);
      const timeSlot = meeting.timeSlotId ? await ctx.db.get(meeting.timeSlotId) : null;
      return {
        ...meeting,
        student,
        timeSlot,
      };
    }));
  }
});

export const deleteMeeting = mutation({
  args: { id: v.id('meeting') },
  handler: async (ctx, args) => {
    const advisor = await getLoggedInAdvisor(ctx);
    if (!advisor) {
      throw new ConvexError('You must be an advisor to delete meetings');
    }
    const meeting = await ctx.db.get(args.id);
    if (!meeting) throw new ConvexError('Meeting not found');

    const semester = await ctx.db.get(meeting.semesterId);
    if (!semester || semester.advisorId !== advisor._id) {
      throw new ConvexError('You can only delete meetings for your own semesters');
    }

    await ctx.db.delete(args.id);
  }
});
