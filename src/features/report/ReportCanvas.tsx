import type { MinistryReport } from "../../domain/reportTypes";

type ReportCanvasProps = {
  report: MinistryReport;
};

export function ReportCanvas({ report }: ReportCanvasProps) {
  const departments = Object.values(report.departments);

  return (
    <article className="report-canvas">
      <section className="department-section" aria-label="부서별 보고">
        <h3>부서별 보고</h3>
        <ul className="department-list">
          {departments.map((department) => (
            <li key={department.key}>
              <div>
                <strong>{department.name}</strong>
                {department.summary ? <p className="dept-summary-text">{department.summary}</p> : null}
              </div>
              <span>{department.attendance.toLocaleString("ko-KR")}명</span>
            </li>
          ))}
        </ul>
      </section>

      {report.prayerRequests.length || report.announcements.length ? (
        <section className="memo-section" aria-label="기도와 광고">
          {report.prayerRequests.length ? (
            <div>
              <h3>기도제목</h3>
              <ul>
                {report.prayerRequests.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {report.announcements.length ? (
            <div>
              <h3>광고 / 다음 계획</h3>
              <ul>
                {report.announcements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}
    </article>
  );
}
