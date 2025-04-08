import { NextResponse } from "next/server";
import connect from "../../lib/db";
import ObxResult from "../../lib/models/obx-result";
import { getHighRiskResults } from "../../lib/highRiskAnalyzer";

export const POST = async (request: Request) => {
  try {
    await connect();

    const formData = await request.formData();
    const uploadedFile: any = formData.get("file");

    if (!uploadedFile) {
      return NextResponse.json(
        { error: "No files received." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await uploadedFile.arrayBuffer());
    const hl7Text = buffer.toString("utf-8");

    const segments = hl7Text.split(/\r?\n|\r/);

    const finalData: any[] = [];
    let patientDetails: any = {};
    let results: any[] = [];

    segments.forEach((segment) => {
      const fields = segment.split("|");

      if (fields[0] === "PID") {
        const newPatientId = fields[3] || "";

        if (
          patientDetails.patientId &&
          patientDetails.patientId !== newPatientId
        ) {
          finalData.push({ patientDetails, results });
          results = [];
        }

        patientDetails = {
          patientId: newPatientId,
          patientName: fields[5] || "",
          dob: fields[7] || "",
          gender: fields[8] || "",
        };
      }

      if (fields[0] === "OBX") {
        const resultObj = {
          testName: fields[3] || "",
          result: fields[5] || "",
          units: fields[6] || "",
          referenceRange: fields[7] || "",
          flag: fields[8] || "",
        };
        results.push(resultObj);
      }
    });

    if (patientDetails.patientId) {
      finalData.push({ patientDetails, results });
    }

    let ans = [];
    try {
      ans = await ObxResult.insertMany(finalData);
    } catch (error) {
      console.error("Error inserting data:", error);
    }

    const highRiskSummaries = await Promise.all(
      ans.map((entry) => getHighRiskResults(entry._id))
    );

    return new NextResponse(
      JSON.stringify({
        message: "Uploaded and analyzed HL7",
        patients: highRiskSummaries.filter(Boolean),
      }),
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Fatal Error:", error);
    return new NextResponse("Error in creating: " + error.message, {
      status: 500,
    });
  }
};
