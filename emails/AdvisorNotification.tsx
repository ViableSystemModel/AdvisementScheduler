import {
  Html,
  Head,
  Body,
  Heading,
  Text,
  Section,
  Container,
  Hr,
  Link,
} from "@react-email/components";

export default function AdvisorNotification({
  studentName = "Student",
  studentEmail = "",
  meetingDateTime = "",
  oldMeetingDateTime = "",
}: {
  studentName: string;
  studentEmail: string;
  meetingDateTime?: string;
  oldMeetingDateTime?: string;
}) {
  const isScheduled = Boolean(meetingDateTime);

  return (
    <Html lang="en">
      <Head>
        <title>{`${studentName} ${isScheduled ? "scheduled" : "cancelled"} an advisement meeting`}</title>
      </Head>
      <Body style={body}>
        {/* Header */}
        <Section style={header}>
          <Text style={brandName}>Advisement Scheduler</Text>
        </Section>

        {/* Main card */}
        <Container style={card}>
          <Heading as="h2" style={heading}>
            {isScheduled ? "Meeting Scheduled" : "Meeting Cancelled"}
          </Heading>
          <Text style={subtext}>
            {isScheduled ? `Scheduled for ${meetingDateTime}` : "No upcoming meeting"}
          </Text>

          <Hr style={divider} />

          {isScheduled ? (
            <>
              <Text style={bodyText}>
                <strong>{studentName}</strong>{studentEmail ? <> ({<Link href={`mailto:${studentEmail}`} style={linkStyle}>{studentEmail}</Link>})</> : ""} has scheduled an advisement
                meeting for <strong>{meetingDateTime}</strong>.
              </Text>
              <Text style={bodyText}>
                You can view and manage all upcoming meetings from your
                Advisement Scheduler dashboard.
              </Text>
            </>
          ) : (
            <>
              <Text style={bodyText}>
                <strong>{studentName}</strong>{studentEmail ? <> ({<Link href={`mailto:${studentEmail}`} style={linkStyle}>{studentEmail}</Link>})</> : ""} has cancelled their advisement
                meeting
                {oldMeetingDateTime
                  ? ` that was scheduled for ${oldMeetingDateTime}`
                  : ""}
                .
              </Text>
              <Text style={bodyText}>
                No action is required on your end, but you may want to follow
                up with {studentName} to reschedule.
              </Text>
            </>
          )}

          <Hr style={divider} />

          <Text style={footerNote}>
            This notification was sent automatically by Advisement Scheduler.
          </Text>
        </Container>

        {/* Footer */}
        <Section style={footer}>
          <Text style={footerText}>
            © {new Date().getFullYear()} Advisement Scheduler.
          </Text>
        </Section>
      </Body>
    </Html>
  );
}

/* ─── Styles ────────────────────────────────────────────────────────────── */

const body: React.CSSProperties = {
  backgroundColor: "#f3f4f6",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  margin: "0",
  padding: "0",
};

const header: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderBottom: "1px solid #e5e7eb",
  padding: "16px 32px",
};

const brandName: React.CSSProperties = {
  color: "#3b5bdb",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0",
};

const card: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  margin: "32px auto",
  maxWidth: "520px",
  padding: "40px 48px",
};

const heading: React.CSSProperties = {
  color: "#111827",
  fontSize: "22px",
  fontWeight: "700",
  margin: "0 0 6px",
};

const subtext: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "13px",
  margin: "0 0 24px",
};

const divider: React.CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "20px 0",
};

const bodyText: React.CSSProperties = {
  color: "#374151",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 12px",
};

const footerNote: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "13px",
  lineHeight: "1.5",
  margin: "0",
};

const linkStyle: React.CSSProperties = {
  color: "#3b5bdb",
  textDecoration: "underline",
};

const footer: React.CSSProperties = {
  padding: "0 32px 32px",
  textAlign: "center",
};

const footerText: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: "12px",
  margin: "0",
};