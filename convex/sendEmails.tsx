import { components, internal } from "./_generated/api";
import { Resend, vOnEmailEventArgs } from "@convex-dev/resend";
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { toPlainText } from '@react-email/render';
export const resend: Resend = new Resend(components.resend, {
  onEmailEvent: internal.sendEmails.handleEmailEvent,
});

export const sendEmail = internalMutation({
  args: {
    ownerId: v.id('users'),
    to: v.string(),
    subject: v.string(),
    html: v.string(),
    replyTo: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { ownerId, to, subject, html, replyTo }) => {
    const emailId = await resend.sendEmail(ctx, {
      from: "Advisement Scheduler <no-reply@advisement-scheduler.vercel.app>",
      to,
      subject,
      html,
      text: toPlainText(html),
      replyTo,
    });

    await ctx.db.insert('email', {
      ownerId,
      emailId,
      status: 'email.queued',
      to,
      subject,
      html,
      replyTo,
    });

  },
});

export const handleEmailEvent = internalMutation({
  args: vOnEmailEventArgs,
  handler: async (ctx, { id, event }) => {
    const email = await ctx.db.query('email')
      .filter((q) => q.eq(q.field('emailId'), id))
      .first();
    if (!email) {
      throw new Error("Email not found");
    }
    await ctx.db.patch(email._id, {
      status: event.type,
    });
  },
});