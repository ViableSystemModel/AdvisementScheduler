import { components, internal, api } from "./_generated/api";
import { Resend, vOnEmailEventArgs } from "@convex-dev/resend";
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { toPlainText } from '@react-email/render';
import { action, query, internalAction } from "./_generated/server";
import { getLoggedInAdvisor } from "./auth";
import StudentNotification from "../emails/StudentNotification";
import AdvisorNotification from "../emails/AdvisorNotification";
import { render } from "@react-email/render";
import { DateTime } from "luxon";

export const resend: Resend = new Resend(components.resend, {
  onEmailEvent: internal.sendEmails.handleEmailEvent,
  testMode: false,
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

export const sendStudentEmail = action({
  args: { meetingId: v.id("meeting") },
  handler: async (ctx, args) => {
    const advisor = await ctx.runQuery(api.auth.loggedInUser);
    if (!advisor) throw new Error("You must be an advisor to send emails");

    const meeting = await ctx.runQuery(api.meetings.getMeeting, { meetingId: args.meetingId });
    if (!meeting) throw new Error("Meeting not found");
    if (!meeting.student.email) throw new Error("Student does not have an email address");

    const advisorName = meeting.advisor.name || "your advisor";
    const meetingLink = `${process.env.HOST_URL || "http://localhost:5173"}/meetings/${meeting._id}`;

    const html = await render(
      <StudentNotification
        studentName={meeting.student.name}
        advisorName={advisorName}
        advisorEmail={meeting.advisor.email || ""}
        meetingLink={meetingLink}
      />
    );

    await ctx.runMutation(internal.sendEmails.sendEmail, {
      ownerId: meeting.advisor._id,
      to: meeting.student.email,
      subject: `Schedule your advisement meeting — ${advisorName}`,
      html,
      replyTo: meeting.advisor.email ? [meeting.advisor.email] : undefined,
    });
  }
});

export const sendMeetingBookedEmail = internalAction({
  args: { meetingId: v.id("meeting") },
  handler: async (ctx, args) => {
    const meeting = await ctx.runQuery(api.meetings.getMeeting, { meetingId: args.meetingId });
    if (!meeting) throw new Error("Meeting not found");
    if (!meeting.advisor.email) return;

    const timeSlot = meeting.timeSlotId ? meeting.availableSlots.find((s: any) => s._id === meeting.timeSlotId) : null;
    let meetingDateTime = "";
    if (timeSlot) {
      meetingDateTime = DateTime.fromSeconds(timeSlot.startDateTime).toLocaleString(DateTime.DATETIME_MED);
    }

    const html = await render(
      <AdvisorNotification
        studentName={meeting.student.name}
        studentEmail={meeting.student.email || ""}
        meetingDateTime={meetingDateTime}
      />
    );

    await ctx.runMutation(internal.sendEmails.sendEmail, {
      ownerId: meeting.advisor._id,
      to: meeting.advisor.email,
      subject: `${meeting.student.name} scheduled an advisement meeting`,
      html,
    });
  }
});

export const sendMeetingCancelledEmail = internalAction({
  args: { meetingId: v.id("meeting"), oldMeetingDateTime: v.string() },
  handler: async (ctx, args) => {
    const meeting = await ctx.runQuery(api.meetings.getMeeting, { meetingId: args.meetingId });
    if (!meeting) throw new Error("Meeting not found");
    if (!meeting.advisor.email) return;

    const html = await render(
      <AdvisorNotification
        studentName={meeting.student.name}
        studentEmail={meeting.student.email || ""}
        oldMeetingDateTime={args.oldMeetingDateTime}
      />
    );

    await ctx.runMutation(internal.sendEmails.sendEmail, {
      ownerId: meeting.advisor._id,
      to: meeting.advisor.email,
      subject: `${meeting.student.name} cancelled an advisement meeting`,
      html,
    });
  }
});

export const listEmails = query({
  handler: async (ctx) => {
    const advisor = await getLoggedInAdvisor(ctx);
    if (!advisor) {
      throw new Error("You must be an advisor to view emails");
    }

    const emails = await ctx.db.query("email")
      .withIndex("by_owner", q => q.eq("ownerId", advisor._id))
      .order("desc")
      .collect();

    return emails;
  }
});

export const listEmailsByTo = query({
  args: { to: v.string() },
  handler: async (ctx, args) => {
    const advisor = await getLoggedInAdvisor(ctx);
    if (!advisor) {
      throw new Error("You must be an advisor to view emails");
    }

    const emails = await ctx.db.query("email")
      .withIndex("by_to", q => q.eq("to", args.to))
      .filter(q => q.eq(q.field("ownerId"), advisor._id))
      .order("desc")
      .collect();

    return emails;
  }
});