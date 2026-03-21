import { Authenticated, Unauthenticated } from "convex/react";
import { SignInForm } from "./SignInForm";
import { SignUpForm } from "./SignUpForm";
import { PropsWithChildren, useState } from "react";
import { AdminBreadcrumbs } from "./AdminBreadcrumbs";

interface AdminPageProps extends PropsWithChildren {
  segmentOverrides?: Record<string, string>
}

export function AdminPage({ segmentOverrides, children }: AdminPageProps) {
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');

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
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {mode === 'signIn' ? 'Admin Sign-In' : 'Create Advisor Account'}
            </h1>
            <p className="text-gray-600">
              {mode === 'signIn'
                ? 'If you are a student seeing this page, please email your advisor for a meeting scheduler link'
                : 'Sign up with a whitelisted email address to create your advisor account'}
            </p>
          </div>
          {mode === 'signIn' ? <SignInForm /> : <SignUpForm />}
          <div className="text-center mt-6">
            {mode === 'signIn' ? (
              <p className="text-sm text-gray-600">
                Need an advisor account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signUp')}
                  className="text-primary font-medium hover:underline"
                >
                  Sign up
                </button>
              </p>
            ) : (
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signIn')}
                  className="text-primary font-medium hover:underline"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </Unauthenticated>
    </div>
  );
}