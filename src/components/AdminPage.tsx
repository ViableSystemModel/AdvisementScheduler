import { Authenticated, Unauthenticated } from "convex/react";
import { SignInForm } from "./SignInForm";
import { PropsWithChildren } from "react";
import { AdminBreadcrumbs } from "./AdminBreadcrumbs";

interface AdminPageProps extends PropsWithChildren {
  segmentOverrides?: Record<string, string>
}

export function AdminPage({ segmentOverrides, children }: AdminPageProps) {
  return (
    <div className="max-w-6xl mx-auto">
      <Authenticated>
        <div className="py-4">
          <AdminBreadcrumbs segmentOverrides={segmentOverrides} />
        </div>
        {children}
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