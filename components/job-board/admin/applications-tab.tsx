"use client"

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
import { FileText, Inbox, X } from "lucide-react"

export function ApplicationsTab({
  applications,
  filterJobId,
  filterJobTitle,
  onClearFilter,
}: {
  applications: Application[]
  filterJobId?: string | null
  filterJobTitle?: string | null
  onClearFilter?: () => void
}) {
  const displayed = filterJobId
    ? applications.filter((a) => a.jobId === filterJobId)
    : applications

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>לוג פניות</CardTitle>
            <CardDescription>
              {filterJobId
                ? `${displayed.length} פניות למשרת "${filterJobTitle ?? filterJobId}"`
                : `${applications.length} פניות שהתקבלו דרך הטופס באתר`}
            </CardDescription>
          </div>
          {filterJobId && onClearFilter && (
            <Button variant="outline" size="sm" onClick={onClearFilter}>
              <X data-icon="inline-start" />
              הצג הכל
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {displayed.length === 0 ? (
          <Empty className="border py-14">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Inbox />
              </EmptyMedia>
              <EmptyTitle>
                {filterJobId ? "אין פניות למשרה זו" : "אין פניות עדיין"}
              </EmptyTitle>
              <EmptyDescription>
                {filterJobId
                  ? "לא הוגשו מועמדויות למשרה זו עדיין."
                  : "פניות חדשות שיוגשו דרך הטופס באתר יופיעו כאן."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">שם המועמד</TableHead>
                  {!filterJobId && (
                    <TableHead className="text-right">משרה</TableHead>
                  )}
                  <TableHead className="text-right">טלפון</TableHead>
                  <TableHead className="text-right">תאריך</TableHead>
                  <TableHead className="text-left">קו"ח</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayed.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium text-foreground">
                      {app.name}
                    </TableCell>
                    {!filterJobId && (
                      <TableCell className="text-muted-foreground">
                        {app.jobTitle}
                      </TableCell>
                    )}
                    <TableCell dir="ltr" className="text-right text-muted-foreground">
                      {app.phone}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatHebrewDate(app.date)}
                    </TableCell>
                    <TableCell className="text-left">
                      {app.cvDataUrl ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(app.cvDataUrl, "_blank")}
                        >
                          <FileText data-icon="inline-start" />
                          צפייה
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {app.cvFileName ? "נשלח במייל" : "—"}
                        </span>
                      )}
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
