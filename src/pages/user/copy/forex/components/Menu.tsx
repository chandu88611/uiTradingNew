// src/pages/copytrading/forex/components/Menu.tsx
import React, { useState } from "react";
import { MoreVertical } from "lucide-react";

export default function Menu({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((p) => !p)} className="rounded-lg p-2 hover:bg-slate-100/10">
        <MoreVertical size={18} className="text-slate-400" />
      </button>

      {open ? (
        <div className="absolute right-0 top-10 w-40 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
          >
            Edit
          </button>
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 text-rose-600"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
          >
            Delete
          </button>
        </div>
      ) : null}
    </div>
  );
}
