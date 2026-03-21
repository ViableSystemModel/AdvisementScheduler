import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { query } from "./_generated/server";
import { internal } from "./_generated/api";
import { QueryCtx } from './types';
import { ConvexError } from "convex/values";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        return {
          email: (params.email as string).toLowerCase(),
        };
      },
    }),
  ],
  callbacks: {
    async afterUserCreatedOrUpdated(ctx, args) {
      // Only enforce whitelist for new credentials accounts
      if (args.type === "credentials" && args.existingUserId === null) {
        const email = args.profile.email as string | undefined;
        if (!email) {
          throw new ConvexError("Email is required for sign-up.");
        }
        
        const whitelisted = await (ctx as any).db
          .query("advisorWhitelist")
          .withIndex("by_email", (q: any) => q.eq("email", email.toLowerCase()))
          .unique();
          
        if (!whitelisted) {
          throw new ConvexError(
            "This email is not authorized to create an advisor account."
          );
        }
      }
    },
  },
});

export const getLoggedInAdvisor = async (ctx: QueryCtx) => {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    return null;
  }
  const user = await ctx.db.get(userId);
  if (!user) {
    return null;
  }

  // Check against the whitelist table instead of hardcoded email
  const whitelistEntry = await ctx.db
    .query("advisorWhitelist")
    .withIndex("by_email", (q) => q.eq("email", (user.email as string)?.toLowerCase()))
    .unique();

  if (!whitelistEntry) {
    return null;
  }

  return user;
}

export const loggedInUser = query({
  handler: getLoggedInAdvisor,
});
