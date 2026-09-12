import type { ReactNode } from "react";

interface Column<T> {
  header: string;
  render: (row: T) => ReactNode;
  key: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyMessage?: string;
}

export function Table<T>({ columns, rows, rowKey, emptyMessage = "No data." }: TableProps<T>) {
  if (rows.length === 0) {
    return <p className="py-4 text-[0.85rem] text-muted">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[0.85rem]">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="border-b border-border px-3 py-[0.55rem] text-left text-[0.72rem] font-medium tracking-wide text-muted uppercase whitespace-nowrap"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="hover:bg-surface-alt">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className="border-b border-border px-3 py-[0.55rem] text-left whitespace-nowrap"
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export type { Column };
