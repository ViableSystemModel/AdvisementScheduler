import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { query } from "./_generated/server";
import { QueryCtx } from './types';


export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
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
  if (user.email !== 'cars2550@fredonia.edu') {
    return null;
  }

  return user;
}

export const loggedInUser = query({
  handler: getLoggedInAdvisor,
});
