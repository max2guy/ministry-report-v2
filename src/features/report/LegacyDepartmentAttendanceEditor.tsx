import type { DepartmentKey, DepartmentReport } from "../../domain/reportTypes";

type LegacyDepartmentAttendanceEditorProps = {
  department: DepartmentReport;
  onChange: (key: DepartmentKey, patch: Partial<DepartmentReport>) => void;
};

function numericInputValue(value: number): string {
  return value === 0 ? "" : String(value);
}

export function LegacyDepartmentAttendanceEditor({
  department,
  onChange,
}: LegacyDepartmentAttendanceEditorProps) {
  return (
    <div className="department-number-grid">
      <label>
        출석
        <input
          min="0"
          type="number"
          value={numericInputValue(department.attendance)}
          onChange={(event) =>
            onChange(department.key, {
              attendance: Number(event.currentTarget.value) || 0,
            })
          }
        />
      </label>
      <label>
        새가족
        <input
          min="0"
          type="number"
          value={numericInputValue(department.newVisitors)}
          onChange={(event) =>
            onChange(department.key, {
              newVisitors: Number(event.currentTarget.value) || 0,
            })
          }
        />
      </label>
    </div>
  );
}
