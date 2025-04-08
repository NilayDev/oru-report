import ObxResult from "./models/obx-result";
import diagnosticMetric from "./models/diagnosticMetric";
import { Types } from "mongoose";

export async function getHighRiskResults(latestResultId: string) {
  const obxResult = await ObxResult.findOne({
    _id: new Types.ObjectId(latestResultId),
  });

  if (!obxResult) return null;

  const patient = obxResult.patientDetails;
  const age = calculateAgeFromDOB(patient.dob);
  const gender = normalizeGender(patient.gender);

  const diagnosticMetrics = await diagnosticMetric.find({});
  const highRisk = [];

  for (const result of obxResult.results) {
    if (!result.result || isNaN(result.result)) {
      continue;
    }

    // Extract and normalize test code and units
    const testCodeRaw = result.testName?.split("^")[1] || "";
    const testCode = testCodeRaw.replace(/:/g, "").trim().toLowerCase();
    const unit = result.units?.split("^")[0]?.trim().toLowerCase();

    if (!testCode || !unit) {
      continue;
    }

    const matchedMetrics = diagnosticMetrics.filter((metric) => {
      const codes: string[] =
        metric.oru_sonic_codes?.split(";").map((c: string) => c.trim().toLowerCase()) || [];
      const units: string[] =
        metric.oru_sonic_units?.split(";").map((u: string) => u.trim().toLowerCase()) || [];

      return codes.includes(testCode) && units.includes(unit);
    });

    if (!matchedMetrics.length) {
      continue;
    }

    const selectedMetric = pickMostSpecificMetric(matchedMetrics, age, gender);
    if (!selectedMetric) {
      continue;
    }

    const lower = selectedMetric.everlab_lower ?? selectedMetric.standard_lower;
    const upper = selectedMetric.everlab_higher ?? selectedMetric.standard_higher;

    const value = parseFloat(result.result);

    if (lower !== undefined && upper !== undefined) {
      let flag = "NORMAL";
      if (value < lower) flag = "LOW";
      else if (value > upper) flag = "HIGH";

      highRisk.push({
        testName: result.testName,
        result: result.result,
        units: unit,
        referenceRange: `${lower} - ${upper}`,
        flag,
        matchedMetric: selectedMetric.name,
      });
    }
  }

  return {
    patientName: `${patient.patientName?.split("^")[1] || ""} ${patient.patientName?.split("^")[0] || ""
      }`.trim(),
    patientId: patient.patientId,
    dob: formatDOB(patient.dob),
    gender,
    highRiskResults: highRisk,
  };
}

interface DiagnosticMetric {
  oru_sonic_codes?: string;
  oru_sonic_units?: string;
  everlab_lower?: number;
  everlab_higher?: number;
  standard_lower?: number;
  standard_higher?: number;
  min_age?: number;
  max_age?: number;
  gender: "Male" | "Female" | "Any";
  name: string;
}

function calculateAgeFromDOB(dobStr: string): number {
  const year = parseInt(dobStr.slice(0, 4));
  const month = parseInt(dobStr.slice(4, 6)) - 1;
  const day = parseInt(dobStr.slice(6, 8));
  const birthDate = new Date(year, month, day);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function pickMostSpecificMetric(
  metrics: DiagnosticMetric[],
  age: number,
  gender: "Male" | "Female" | "Any"
): DiagnosticMetric | undefined {
  const filtered = metrics.filter(
    (m) =>
      (!m.min_age || age >= m.min_age) &&
      (!m.max_age || age <= m.max_age) &&
      (m.gender === "Any" || m.gender === gender)
  );

  if (filtered.length === 0) return undefined;

  return filtered.sort((a, b) => {
    const ageSpanA = (a.max_age ?? 200) - (a.min_age ?? 0);
    const ageSpanB = (b.max_age ?? 200) - (b.min_age ?? 0);
    return ageSpanA - ageSpanB;
  })[0];
}

function formatDOB(dobStr: string): string {
  return `${dobStr.slice(0, 4)}-${dobStr.slice(4, 6)}-${dobStr.slice(6, 8)}`;
}

function normalizeGender(g: string): "Male" | "Female" | "Any" {
  if (g.toUpperCase().startsWith("M")) return "Male";
  if (g.toUpperCase().startsWith("F")) return "Female";
  return "Any";
}
