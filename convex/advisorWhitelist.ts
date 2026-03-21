import { query, mutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

/**
 * Check if an email is on the advisor whitelist.
 */
export const isWhitelisted = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const entry = await ctx.db
      .query("advisorWhitelist")
      .withIndex("by_email", (q) => q.eq("email", email.toLowerCase()))
      .unique();
    return entry !== null;
  },
});

/**
 * Internal query for use within auth profile hook (via ctx.runQuery).
 */
export const isWhitelistedInternal = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const entry = await ctx.db
      .query("advisorWhitelist")
      .withIndex("by_email", (q) => q.eq("email", email.toLowerCase()))
      .unique();
    return entry !== null;
  },
});

/**
 * Seed the whitelist with the initial advisor email.
 * Safe to call multiple times — skips if already present.
 */
export const seed = mutation({
  handler: async (ctx) => {
    const email = "cars2550@fredonia.edu";
    const existing = await ctx.db
      .query("advisorWhitelist")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    if (!existing) {
      await ctx.db.insert("advisorWhitelist", { email });
    }
  },
});
