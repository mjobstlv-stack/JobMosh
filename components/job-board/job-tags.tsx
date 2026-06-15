import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, Building } from "lucide-react"
import type { Job } from "@/lib/job-board-data"

export function JobTags({ job }: { job: Job }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="secondary" className="gap-1 font-normal">
        <MapPin className="size-3" />
        {job.region}
      </Badge>
      <Badge variant="secondary" className="gap-1 font-normal">
        <Clock className="size-3" />
        {job.jobType}
      </Badge>
      <Badge variant="secondary" className="gap-1 font-normal">
        <Building className="size-3" />
        {job.workModel}
      </Badge>
    </div>
  )
}
