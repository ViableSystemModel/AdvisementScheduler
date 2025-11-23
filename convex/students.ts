import { ConvexError, v } from 'convex/values';
import { getLoggedInAdvisor } from './auth';
import { mutation, query } from './_generated/server';

export const list = query({
  handler: async (ctx) => {
    const advisor = await getLoggedInAdvisor(ctx);
    if (!advisor) {
      throw new ConvexError('You must be an advisor to view students');
    }

    const students = await ctx.db.query('student')
      .withIndex('by_advisor', q => q.eq('advisorId', advisor._id))
      .collect();

    return await Promise.all(students.map(async (student) => {
      const meetings = await ctx.db.query('meeting')
        .withIndex('by_student', q => q.eq('studentId', student._id))
        .collect();

      if (meetings.length === 0) {
        return { ...student, lastMeetingSemester: null };
      }

      const semesterIds = [...new Set(meetings.map(m => m.semesterId))];
      const semesters = await Promise.all(
        semesterIds.map(id => ctx.db.get(id))
      );

      const sortedSemesters = semesters
        .filter((s): s is NonNullable<typeof s> => s !== null)
        .sort((a, b) => b.startDate - a.startDate);

      return {
        ...student,
        lastMeetingSemester: sortedSemesters[0]?.displayName ?? null
      };
    }));
  }
});

export const create = mutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const advisor = await getLoggedInAdvisor(ctx);
    if (!advisor) {
      throw new ConvexError('You must be an advisor to create a student');
    }

    return await ctx.db.insert('student', {
      advisorId: advisor._id,
      name: args.name,
      email: args.email,
      phone: args.phone,
    });
  }
});

export const update = mutation({
  args: {
    id: v.id('student'),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const advisor = await getLoggedInAdvisor(ctx);
    if (!advisor) {
      throw new ConvexError('You must be an advisor to update a student');
    }

    const student = await ctx.db.get(args.id);
    if (!student) {
      throw new ConvexError('Student not found');
    }

    if (student.advisorId !== advisor._id) {
      throw new ConvexError('You can only update your own students');
    }

    await ctx.db.patch(args.id, {
      name: args.name,
      email: args.email,
      phone: args.phone,
    });
  }
});

export const deleteStudent = mutation({
  args: {
    id: v.id('student'),
  },
  handler: async (ctx, args) => {
    const advisor = await getLoggedInAdvisor(ctx);
    if (!advisor) {
      throw new ConvexError('You must be an advisor to delete a student');
    }

    const student = await ctx.db.get(args.id);
    if (!student) {
      throw new ConvexError('Student not found');
    }

    if (student.advisorId !== advisor._id) {
      throw new ConvexError('You can only delete your own students');
    }

    await ctx.db.delete(args.id);
  }
});
