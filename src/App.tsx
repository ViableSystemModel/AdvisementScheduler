import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { useState } from "react";
import { AdminDashboard } from "./components/AdminDashboard";
import { BookingInterface } from "./components/BookingInterface";

export default function App() {
  const [currentView, setCurrentView] = useState<"admin" | "booking">("admin");
  const [bookingMeetingId, setBookingMeetingId] = useState<string>("");

  // Check if we have a meeting ID in the URL
  const urlParams = new URLSearchParams(window.location.search);
  const meetingIdFromUrl = urlParams.get("meeting");

  if (meetingIdFromUrl && currentView === "admin") {
    setCurrentView("booking");
    setBookingMeetingId(meetingIdFromUrl);
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-primary">Meeting Scheduler</h2>
          {!meetingIdFromUrl && (
            <nav className="flex gap-2">
              <button
                onClick={() => setCurrentView("admin")}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  currentView === "admin"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Admin
              </button>
              <button
                onClick={() => setCurrentView("booking")}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  currentView === "booking"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Book Meeting
              </button>
            </nav>
          )}
        </div>
        <SignOutButton />
      </header>
      <main className="flex-1 p-8">
        <Content 
          currentView={meetingIdFromUrl ? "booking" : currentView}
          bookingMeetingId={meetingIdFromUrl || bookingMeetingId}
          setBookingMeetingId={setBookingMeetingId}
        />
      </main>
      <Toaster />
    </div>
  );
}

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
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Meeting Scheduler</h1>
            <p className="text-gray-600">Sign in to manage your meetings</p>
          </div>
          <SignInForm />
        </div>
      </Unauthenticated>
    </div>
  );
}
