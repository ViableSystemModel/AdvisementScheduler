import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { AdminDashboard } from "./AdminDashboard";
import { BookingInterface } from "./BookingInterface";

function Content({ 
  currentView, 
  bookingMeetingId, 
  setBookingMeetingId 
}: { 
  currentView: "admin" | "booking";
  bookingMeetingId: string;
  setBookingMeetingId: (id: string) => void;
}) {
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (currentView === "booking") {
    return (
      <BookingInterface 
        meetingId={bookingMeetingId}
        onMeetingIdChange={setBookingMeetingId}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Authenticated>
        <AdminDashboard />
      </Authenticated>
      <Unauthenticated>
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Admin Sign-In</h1>
            <p className="text-gray-600">If you are a student seeing this page, please email your advisor for a meeting scheduler link</p>
          </div>
          <SignInForm />
        </div>
      </Unauthenticated>
    </div>
  );
}
