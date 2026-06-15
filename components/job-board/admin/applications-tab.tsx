"use client"

import { toast } from "sonner"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from "@/components/ui/empty"
import { formatHebrewDate, type Application } from "@/lib/job-board-data"
import { FileText, Inbox } from "lucide-react"

export function ApplicationsTab({
  applications,
}: {
  applications: Application[]
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>לוג פניות</CardTitle>
        <CardDescription>
          {applications.length} פניות שהתקבלו דרך הטופס באתר
        </CardDescription>
      </CardHeader>
      <CardContent>
        {applications.length === 0 ? (
          <Empty className="border py-14">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Inbox />
              </EmptyMedia>
              <EmptyTitle>אין פניות עדיין</EmptyTitle>
              <EmptyDescription>
                פניות חדשות שיוגשו דרך הטופס באתר יופיעו כאן.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">שם המועמד</TableHead>
                  <TableHead className="text-right">משרה</TableHead>
                  <TableHead className="text-right">טלפון</TableHead>
                  <TableHead className="text-right">תאריך</TableHead>
                  <TableHead className="text-left">קו"ח</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium text-foreground">
                      {app.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {app.jobTitle}
                    </TableCell>
                    <TableCell dir="ltr" className="text-right text-muted-foreground">
                      {app.phone}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatHebrewDate(app.date)}
                    </TableCell>
                    <TableCell className="text-left">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          toast.info("צפייה בקורות חיים", {
                            description: `קובץ קורות החיים של ${app.name} (הדגמה).`,
                          })
                        }
                      >
                        <FileText data-icon="inline-start" />
                        צפייה
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
