import { useState } from "react";
import { parseReportImport } from "../../domain/reportImport";
import type { MinistryReport } from "../../domain/reportTypes";

type LegacyImportPanelProps = {
  onImport: (reports: MinistryReport[], warnings: string[]) => void;
  onImportError: (message: string) => void;
  warnings: string[];
};

export function LegacyImportPanel({
  onImport,
  onImportError,
  warnings,
}: LegacyImportPanelProps) {
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    try {
      const json = JSON.parse(await file.text());
      const results = parseReportImport(json);
      const reports = results.map((result) => result.report);
      const warnings = results.flatMap((result) => result.warnings);

      onImport(reports, warnings);
      setError("");
    } catch {
      const message = "가져올 수 없는 데이터입니다.";
      setError(message);
      onImportError(message);
    }
  }

  return (
    <section className="import-panel" aria-label="기존 데이터 가져오기">
      <label className="import-file-btn">
        JSON 가져오기
        <input
          type="file"
          accept="application/json,.json"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            if (file) void handleFile(file);
          }}
        />
      </label>
      {error ? <p role="alert">{error}</p> : null}
      {warnings.length ? (
        <section className="import-warnings" aria-label="가져오기 경고">
          <h3>가져오기 경고</h3>
          <ul>
            {warnings.map((warning, index) => (
              <li key={`${warning}-${index}`}>{warning}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  );
}
