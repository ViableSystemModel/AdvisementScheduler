import { api } from "@convex/_generated/api"
import { useQuery } from "convex/react"
import { Spinner } from "@/components/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Muted } from "../ui/typography"
import { DateTime } from "luxon"
import { SemesterDeletionDialog } from "./SemesterDeletionDialog"
import { Link } from "@tanstack/react-router"

export function SemesterList() {
  const semesters = useQuery(api.semesters.list)

  if (semesters == null) {
    return <Spinner />
  }

  return (
    <Table>
      <colgroup>
        <col span={1} />
        <col span={1} style={{ width: '100px' }} />
        <col span={1} style={{ width: '100px' }} />
        <col span={1} style={{ width: '50px' }} />
      </colgroup>

      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Start Date</TableHead>
          <TableHead>End Date</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {semesters.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4}><Muted>No semesters have been created yet</Muted></TableCell>
          </TableRow>
        ) : semesters.map(semester => (
          <TableRow key={semester._id}>
            <TableCell className="font-medium">
              <Link
                to="/admin/semesters/$semesterId"
                params={{ semesterId: semester._id }}
                className="hover:underline"
              >
                {semester.displayName}
              </Link>
            </TableCell>
            <TableCell>{DateTime.fromSeconds(semester.startDate).toLocaleString(DateTime.DATE_MED)}</TableCell>
            <TableCell>{DateTime.fromSeconds(semester.endDate).toLocaleString(DateTime.DATE_MED)}</TableCell>
            <TableCell className="text-right">
              <SemesterDeletionDialog semesterId={semester._id} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}