import { ConvexError, v } from 'convex/values';
import { getLoggedInAdvisor } from './auth';
import { mutation, query } from './_generated/server';
import { DateTime } from 'luxon'
import { QueryCtx } from './types';
import { Id } from './_generated/dataModel';

type SemesterIds = {
  advisorId: Id<'users'>
} | {
  semesterId: Id<'semester'>
}
export const _requireSemester = async (ctx: QueryCtx, ids: SemesterIds) => {
  if ('semesterId' in ids) {
    const semester = await ctx.db.get(ids.semesterId)
    if (!semester) {
      throw new ConvexError('Could not find semester')
    }
    return semester
  }

  const now = DateTime.now().toSeconds()
  const semester = await ctx.db.query('semester')
    .filter(q => q.eq(q.field('advisorId'), ids.advisorId))
    .filter(q => q.lte(q.field('startDate'), now))
    .filter(q => q.gte(q.field('endDate'), now))
    .first()
  if (!semester) {
    throw new ConvexError('Could not find active semester')
  }
  return semester
}

export const active = query({
  handler: async (ctx) => {
    const advisor = await getLoggedInAdvisor(ctx);
    if (!advisor) {
      throw new ConvexError('You must be an advisor to view the active semester');
    }

    return _requireSemester(ctx, { advisorId: advisor._id });
  }
})

export const list = query({
  handler: async (ctx) => {
    const advisor = await getLoggedInAdvisor(ctx);
    if (!advisor) {
      throw new ConvexError('You must be an advisor to view the semester list');
    }

    return ctx.db.query('semester')
      .filter(q => q.eq(q.field('advisorId'), advisor._id))
      .order('desc')
      .collect()
  }
});

export const get = query({
  args: {
    id: v.id('semester'),
  },
  handler: async (ctx, args) => {
    const advisor = await getLoggedInAdvisor(ctx);
    if (!advisor) {
      throw new ConvexError('You must be an advisor to view a semester');
    }

    const semester = await ctx.db.get(args.id);
    if (!semester) {
      return null;
    }

    if (semester.advisorId !== advisor._id) {
      throw new ConvexError('You can only view your own semesters');
    }

    return semester;
  }
});

export const create = mutation({
  args: {
    displayName: v.string(),
    startDate: v.number(),  // seconds since epoch
    endDate: v.number(),  // seconds since epoch
  },
  handler: async (ctx, args) => {
    const advisor = await getLoggedInAdvisor(ctx);
    if (!advisor) {
      throw new ConvexError('You must be an advisor to create a new semester');
    }

    const { displayName, startDate, endDate } = args;
    if (displayName.length > 50) {
      throw new ConvexError('Display name cannot be more than 50 characters');
    }

    const start = DateTime.fromSeconds(startDate, { zone: 'utc' });
    if (!start.isValid) {
      throw new ConvexError('Start date is invalid');
    }
    const end = DateTime.fromSeconds(endDate, { zone: 'utc' });
    if (!end.isValid) {
      throw new ConvexError('End date is invalid');
    }

    const duration = end.diff(start, ['days'])
    if (duration.days < 1) {
      throw new ConvexError('Semesters must last at least 1 day');
    }
    if (duration.days > 366) {
      throw new ConvexError('Semester must last less than a year');
    }

    const startTimestamp = start.toSeconds();
    const endTimestamp = end.toSeconds();

    const overlappingSemester = await ctx.db.query('semester')
      .filter(q => q.eq(q.field('advisorId'), advisor._id))
      .filter(q => q.gt(q.field('endDate'), startTimestamp))
      .filter(q => q.lt(q.field('startDate'), endTimestamp))
      .first()
    if (overlappingSemester) {
      throw new ConvexError('New semester overlaps with existing semester: ' + overlappingSemester.displayName)
    }

    return await ctx.db.insert('semester', {
      advisorId: advisor._id,
      displayName,
      startDate: startTimestamp,
      endDate: endTimestamp,
    })
  }
})

export const deleteSemester = mutation({
  args: {
    id: v.id('semester'),
  },
  handler: async (ctx, args) => {
    const advisor = await getLoggedInAdvisor(ctx);
    if (!advisor) {
      throw new ConvexError('You must be an advisor to delete a semester');
    }

    const semester = await ctx.db.get(args.id);
    if (!semester) {
      throw new ConvexError('Semester not found');
    }

    if (semester.advisorId !== advisor._id) {
      throw new ConvexError('You can only delete your own semesters');
    }

    await ctx.db.delete(args.id);
  }
})
