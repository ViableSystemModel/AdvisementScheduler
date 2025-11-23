import { Authenticated, Unauthenticated } from "convex/react";
import { SignInForm } from "./SignInForm";
import { PropsWithChildren } from "react";

export function AdminPage(props: PropsWithChildren) {
  return (
    <div className="max-w-6xl mx-auto">
      <Authenticated>
        {props.children}
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