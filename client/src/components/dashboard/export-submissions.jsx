import * as React from "react";
import { Download, FileJson, FileSpreadsheet } from "lucide-react";
import { Button } from "../ui/button";

export function ExportSubmissions({ 
  submissions, 
  formName 
}) {
  
  function downloadBlob(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function exportJSON() {
    const cleanData = submissions.map(s => ({
      id: s.id,
      status: s.status,
      date: s.createdAt,
      submittedBy: s.submittedBy,
      data: s.data
    }));
    const content = JSON.stringify(cleanData, null, 2);
    downloadBlob(content, `${formName.replace(/\s+/g, '_')}_submissions.json`, "application/json");
  }

  function exportCSV() {
    const keys = new Set();
    submissions.forEach(sub => {
      if (sub.data && typeof sub.data === "object") {
        Object.keys(sub.data).forEach(k => keys.add(k));
      }
    });

    const headers = ["ID", "Status", "Date", "Submitted By", ...Array.from(keys)];
    
    const rows = submissions.map(sub => {
      const base = [
        sub.id,
        sub.status,
        new Date(sub.createdAt).toLocaleString(),
        `${sub.submittedBy?.firstName} ${sub.submittedBy?.lastName}`
      ];

      const dataCols = Array.from(keys).map(k => {
        let val = sub.data?.[k];
        if (val === null || val === undefined) return "";
        if (typeof val === "object") val = JSON.stringify(val);
        val = String(val).replace(/"/g, '""');
        return `"${val}"`;
      });

      return [...base, ...dataCols].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    downloadBlob(csvContent, `${formName.replace(/\s+/g, '_')}_submissions.csv`, "text/csv;charset=utf-8;");
  }

  if (submissions.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={exportCSV}>
        <FileSpreadsheet className="h-3.5 w-3.5 text-clinical-teal" /> CSV
      </Button>
      <Button variant="outline" size="sm" onClick={exportJSON}>
        <FileJson className="h-3.5 w-3.5 text-clinical-sage" /> JSON
      </Button>
    </div>
  );
}
