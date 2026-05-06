// LocalStorage-based report persistence
const KEY = "forensiq_reports";

export function saveReport(report) {
  const reports = loadReports();
  const newReport = {
    ...report,
    id: crypto.randomUUID(),
    created_date: new Date().toISOString(),
  };
  reports.unshift(newReport);
  if (reports.length > 100) reports.splice(100);
  localStorage.setItem(KEY, JSON.stringify(reports));
  return newReport;
}

export function loadReports() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function deleteReport(id) {
  const reports = loadReports().filter((r) => r.id !== id);
  localStorage.setItem(KEY, JSON.stringify(reports));
}