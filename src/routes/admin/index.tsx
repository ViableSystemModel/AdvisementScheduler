import { AdminPage } from '@/components/AdminPage';
import { createFileRoute, Link } from '@tanstack/react-router'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar, Users, Mail } from 'lucide-react';

export const Route = createFileRoute('/admin/')({
  component: AdminIndex,
})

function AdminIndex() {
  return (
    <AdminPage>
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <Link to="/admin/semesters" className="block">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-6 w-6" />
                Manage Semesters
              </CardTitle>
              <CardDescription>
                Create and manage semesters, set up time slots, and view schedules.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link to="/admin/students" className="block">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6" />
                Manage Students
              </CardTitle>
              <CardDescription>
                View student lists, manage permissions, and track student progress.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link to="/admin/emails" className="block">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-6 w-6" />
                Email Tracking
              </CardTitle>
              <CardDescription>
                Track sent notifications, verify delivery status, and view history.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </AdminPage>
  )
}
