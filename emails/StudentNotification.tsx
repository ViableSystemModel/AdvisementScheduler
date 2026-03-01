import {
  Button,
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

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function StudentNotification({
  studentName = "Student",
  advisorName = "your advisor",
  advisorEmail = "",
  meetingLink = "https://advisement-scheduler.vercel.app",
}: {
  studentName: string;
  advisorName: string;
  advisorEmail: string;
  meetingLink: string;
}) {
  return (
    <Html lang="en">
      <Head>
        <title>{`Schedule your advisement meeting — ${advisorName}`}</title>
      </Head>
      <Body style={body}>
        {/* Header */}
        <Section style={header}>
          <Text style={brandName}>Advisement Scheduler</Text>
        </Section>

        {/* Main card */}
        <Container style={card}>
          <Heading as="h2" style={heading}>
            Advisement meeting with {advisorName}
          </Heading>
          <Text style={subtext}>Duration: 15 minutes</Text>

          <Hr style={divider} />

          <Text style={bodyText}>
            Hi {studentName},
          </Text>
          <Text style={bodyText}>
            {capitalize(advisorName)} has invited you to schedule an advisement meeting.
            Use the link below to view available time slots and book a time that
            works for you.
          </Text>

          <Section style={buttonWrapper}>
            <Button href={meetingLink} style={ctaButton}>
              View Available Time Slots
            </Button>
          </Section>

          <Hr style={divider} />

          <Text style={footerNote}>
            Questions? Reply to this email or contact your advisor directly
            {advisorEmail ? (
              <>
                {" "}at{" "}
                <Link href={`mailto:${advisorEmail}`} style={linkStyle}>
                  {advisorEmail}
                </Link>
              </>
            ) : (
              "."
            )}
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

const buttonWrapper: React.CSSProperties = {
  margin: "28px 0",
  textAlign: "center",
};

const ctaButton: React.CSSProperties = {
  backgroundColor: "#3b5bdb",
  borderRadius: "6px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "15px",
  fontWeight: "600",
  padding: "12px 28px",
  textDecoration: "none",
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