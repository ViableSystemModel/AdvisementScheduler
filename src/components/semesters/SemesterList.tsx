import { api } from "@convex/_generated/api"
import { useQuery } from "convex/react"
import { Spinner } from "@/components/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Muted } from "../ui/typography"
import { DateTime } from "luxon"

export function SemesterList() {
  const semesters = useQuery(api.semesters.list)

  if (semesters == null) {
    return <Spinner/>
  }

  return (
    <Table>
      <colgroup>
        <col span={1} />
        <col span={1} style={{width: '100px'}}/>
        <col span={1} style={{width: '100px'}}/>
      </colgroup>
      
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Start Date</TableHead>
          <TableHead>End Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {semesters.length === 0 ? (
          <TableRow>
            <TableCell colSpan={3}><Muted>No semesters have been created yet</Muted></TableCell>
          </TableRow>
        ) : semesters.map(semester => (
          <TableRow>
            <TableCell>{semester.displayName}</TableCell>
            <TableCell>{DateTime.fromSeconds(semester.startDate).toLocaleString()}</TableCell>
            <TableCell>{DateTime.fromSeconds(semester.endDate).toLocaleString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}