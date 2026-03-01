import { createFileRoute } from '@tanstack/react-router'
import { AdminPage } from '@/components/AdminPage'
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Spinner } from "@/components/ui/spinner"
import { DateTime } from "luxon"

export const Route = createFileRoute('/admin/emails')({
  component: EmailsDashboard,
})

function EmailsDashboard() {
  const emails = useQuery(api.sendEmails.listEmails)

  return (
    <AdminPage>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Email Tracking</h1>
      </div>

      <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
        {emails === undefined ? (
          <div className="p-8 flex justify-center">
            <Spinner />
          </div>
        ) : emails.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No emails sent or tracked yet.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {emails.map((email) => {
                const isSuccess = email.status === "email.delivered" || email.status === "email.opened" || email.status === "email.clicked"
                const isError = email.status === "email.bounced" || email.status === "email.failed" || email.status === "email.complained"
                const displayStatus = email.status.replace("email.", "").replace("_", " ")

                return (
                  <TableRow key={email._id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {DateTime.fromMillis(email._creationTime).toLocaleString(DateTime.DATETIME_MED)}
                    </TableCell>
                    <TableCell className="font-medium">{email.to}</TableCell>
                    <TableCell>{email.subject}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${isSuccess ? "bg-green-100 text-green-800" :
                          isError ? "bg-red-100 text-red-800" :
                            "bg-yellow-100 text-yellow-800"
                        }`}>
                        {displayStatus}
                      </span>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </AdminPage>
  )
}
