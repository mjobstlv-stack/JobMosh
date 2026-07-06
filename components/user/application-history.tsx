import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { formatHebrewDate, type Job } from "@/lib/job-board-data"
import type { UserApplication } from "@/lib/user-types"

export function ApplicationHistory({
  applications,
  jobs,
}: {
  applications: UserApplication[]
  jobs: Job[]
}) {
  const jobMap = new Map(jobs.map(j => [j.id, j]))

  return (
    <Card>
      <CardHeader>
        <CardTitle>הגשות שלי</CardTitle>
        <CardDescription>{applications.length} פניות שהגשת</CardDescription>
      </CardHeader>
      <CardContent>
        {applications.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">עדיין לא הגשת מועמדות לאף משרה</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-right">
                  <th className="pb-3 font-medium text-muted-foreground">משרה</th>
                  <th className="pb-3 font-medium text-muted-foreground">חברה</th>
                  <th className="pb-3 font-medium text-muted-foreground">תאריך</th>
                  <th className="pb-3 font-medium text-muted-foreground">סטטוס</th>
                </tr>
              </thead>
              <tbody>
                {[...applications].reverse().map((app, i) => {
                  const job = jobMap.get(app.jobId)
                  const active = job?.status === "active"
                  return (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-3 font-medium text-foreground">{app.jobTitle}</td>
                      <td className="py-3 text-muted-foreground">{app.company}</td>
                      <td className="py-3 text-muted-foreground">{formatHebrewDate(app.appliedAt)}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          active
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                        }`}>
                          <span className={`size-1.5 rounded-full ${active ? "bg-green-500" : "bg-red-500"}`} />
                          {active ? "פעילה" : "הוסרה"}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
