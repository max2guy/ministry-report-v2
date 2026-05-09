import { useMemo, useState } from "react";
import { createReportBackup } from "../../domain/reportBackup";
import type { DepartmentKey, MinistryReport } from "../../domain/reportTypes";

type ReportHistoryPanelProps = {
  reports: MinistryReport[];
  currentReportId: string;
  onDelete: (report: MinistryReport) => void;
  onDuplicate: (report: MinistryReport) => void;
  onLoad: (report: MinistryReport) => void;
};

function totalAttendance(report: MinistryReport): number {
  return Object.values(report.departments).reduce(
    (total, department) => total + department.attendance,
    0,
  );
}

const DEPARTMENT_KEYS: DepartmentKey[] = [
  "elementary",
  "middleHigh",
  "youngAdult",
  "adult",
];

function departmentAttendanceTotals(
  reports: MinistryReport[],
): Record<DepartmentKey, number> {
  return reports.reduce(
    (totals, storedReport) => {
      DEPARTMENT_KEYS.forEach((key) => {
        totals[key] += storedReport.departments[key].attendance;
      });
      return totals;
    },
    {
      elementary: 0,
      middleHigh: 0,
      youngAdult: 0,
      adult: 0,
    },
  );
}

function departmentSearchParts(report: MinistryReport): string[] {
  return Object.values(report.departments).flatMap((department) => {
    if (
      !department.attendance &&
      !department.newVisitors &&
      !department.summary.trim()
    ) {
      return [];
    }

    return [
      department.name,
      department.attendance.toString(),
      department.newVisitors.toString(),
      department.summary,
    ];
  });
}

function reportSearchText(report: MinistryReport): string {
  return [
    report.reportDate,
    report.title,
    report.churchName,
    report.pastorName,
    totalAttendance(report).toString(),
    ...departmentSearchParts(report),
    ...report.prayerRequests,
    ...report.announcements,
  ]
    .join(" ")
    .toLocaleLowerCase("ko-KR");
}

function downloadBackup(reports: MinistryReport[]) {
  const backup = createReportBackup(reports);
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = `${backup.exportedAt.slice(0, 10)}-ministry-report-v2-backup.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function confirmDelete(report: MinistryReport): boolean {
  return window.confirm(`${report.reportDate} 보고서를 삭제할까요?`);
}

export function ReportHistoryPanel({
  reports,
  currentReportId,
  onDelete,
  onDuplicate,
  onLoad,
}: ReportHistoryPanelProps) {
  const [query, setQuery] = useState("");
  const [reportMonth, setReportMonth] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase("ko-KR");
  const hasActiveFilter = Boolean(normalizedQuery || reportMonth);
  const visibleReports = useMemo(
    () => {
      return reports.filter((storedReport) => {
        const matchesQuery =
          !normalizedQuery ||
          reportSearchText(storedReport).includes(normalizedQuery);
        const matchesMonth =
          !reportMonth || storedReport.reportDate.startsWith(reportMonth);

        return matchesQuery && matchesMonth;
      });
    },
    [normalizedQuery, reportMonth, reports],
  );
  const visibleAttendance = visibleReports.reduce(
    (total, storedReport) => total + totalAttendance(storedReport),
    0,
  );

  return (
    <section className="history-panel" aria-label="저장된 보고서">
      <h2>저장된 보고서</h2>
      {reports.length ? (
        <>
          <label className="history-search">
            보고서 검색
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder="날짜, 제목, 부서 내용"
            />
          </label>
          <label className="history-filter">
            보고월
            <input
              type="month"
              value={reportMonth}
              onChange={(event) => setReportMonth(event.currentTarget.value)}
            />
          </label>
          {hasActiveFilter ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setReportMonth("");
              }}
            >
              필터 초기화
            </button>
          ) : null}
          <p className="history-summary" aria-label="저장 보고서 요약">
            {visibleReports.length.toLocaleString("ko-KR")}개 보고서 · 출석{" "}
            {visibleAttendance.toLocaleString("ko-KR")}명
          </p>
          <button type="button" className="history-backup-btn" onClick={() => downloadBackup(reports)}>
            전체 백업
          </button>
          {visibleReports.length ? (
            <ul>
              {visibleReports.map((storedReport) => (
                <li key={storedReport.id}>
                  <div className="history-item">
                    <button
                      type="button"
                      aria-pressed={storedReport.id === currentReportId}
                      onClick={() => onLoad(storedReport)}
                    >
                      <strong>{storedReport.reportDate}</strong>
                      {storedReport.id === currentReportId && (
                        <span className="history-current-badge">현재</span>
                      )}
                    </button>
                    <div className="history-item-actions">
                      <button
                        type="button"
                        className="history-item-del"
                        onClick={() => {
                          if (confirmDelete(storedReport)) onDelete(storedReport);
                        }}
                      >
                        삭제
                      </button>
                      <button
                        type="button"
                        className="history-item-dup"
                        onClick={() => onDuplicate(storedReport)}
                      >
                        복사
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="helper-text">검색 결과가 없습니다.</p>
          )}
        </>
      ) : (
        <p className="helper-text">저장된 보고서가 없습니다.</p>
      )}
    </section>
  );
}
