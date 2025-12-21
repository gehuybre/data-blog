"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type UnknownRecord = Record<string, any>

interface FilterableTableProps<TData = UnknownRecord> {
  data: TData[]
  metric?: string
  label?: string
  periodHeaders?: string[]
}

export function FilterableTable<TData = UnknownRecord>({
  data,
  metric,
  label = "Aantal",
  periodHeaders,
}: FilterableTableProps<TData>) {
  const hasSortValue = data.some((d: any) => typeof d?.sortValue === "number")
  const sortedData = [...data]

  if (hasSortValue) {
    sortedData.sort((a: any, b: any) => (a.sortValue as number) - (b.sortValue as number))
    sortedData.reverse()
  } else {
    // Best-effort default: keep incoming order but show newest first.
    sortedData.reverse()
  }

  const hasPeriodCells = sortedData.some((d: any) => Array.isArray(d?.periodCells))
  const headers = hasPeriodCells
    ? (periodHeaders ?? ["Periode"])
    : ["Jaar", "Kwartaal"]

  return (
    <div className="max-h-[400px] overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((h, i) => (
              <TableHead key={i}>{h}</TableHead>
            ))}
            <TableHead className="text-right">{label}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((d, i) => (
            <TableRow key={i}>
              {Array.isArray((d as any)?.periodCells) ? (
                (d as any).periodCells.map((c: any, j: number) => <TableCell key={j}>{c}</TableCell>)
              ) : (
                <>
                  <TableCell>{(d as any).y}</TableCell>
                  <TableCell>Q{(d as any).q}</TableCell>
                </>
              )}
              <TableCell className="text-right">
                {typeof (d as any)?.value === "number"
                  ? (d as any).value
                  : metric
                    ? (d as any)?.[metric]
                    : (d as any)?.value}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
