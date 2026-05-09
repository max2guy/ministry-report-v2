import type { MinistryReport } from "../../domain/reportTypes";

type ReportCanvasProps = {
  report: MinistryReport;
};

export function ReportCanvas({ report }: ReportCanvasProps) {
  const departments = Object.values(report.departments);
  const totalAttendance = departments.reduce(
    (total, department) => total + department.attendance,
    0,
  );

  return (
    <article className="report-canvas">
      <header className="report-heading">
        <h2>{report.title}</h2>
      </header>

      <dl className="report-meta">
        <div>
          <dt>보고일</dt>
          <dd>{report.reportDate}</dd>
        </div>
        <div>
          <dt>교회</dt>
          <dd>{report.churchName || "-"}</dd>
        </div>
        <div>
          <dt>담당자</dt>
          <dd>{report.pastorName || "-"}</dd>
        </div>
        <div>
          <dt>출석 합계</dt>
          <dd>{totalAttendance.toLocaleString("ko-KR")}명</dd>
        </div>
      </dl>

      <section className="department-section" aria-label="부서별 보고">
        <h3>부서별 보고</h3>
        <ul className="department-list">
          {departments.map((department) => (
            <li key={department.key}>
              <div>
                <strong>{department.name}</strong>
                {department.summary ? <p>{department.summary}</p> : null}
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
