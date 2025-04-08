"use client";

import { useState } from "react";
import { MdOutlineLocalHospital } from "react-icons/md";

interface HighRiskResult {
  testName: string;
  result: string;
  units: string;
  referenceRange: string;
  flag: string;
  matchedMetric: string;
}

interface Patient {
  patientName: string;
  patientId: string;
  dob: string;
  gender: string;
  highRiskResults: HighRiskResult[];
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadComplete, setUploadComplete] = useState(false); // New state

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFile = e.target.files[0];
      if (selectedFile && selectedFile.type !== "text/plain") {
        setError("Only .txt files are supported.");
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
      setUploadComplete(false); // Reset upload status when file changes
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    setLoading(true);
    setError(null);
    setUploadComplete(false); // Reset before starting

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload-oru", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Server error: ${errorText}`);
      }

      const data = await res.json();
      setPatients(data.patients || []);
      setUploadComplete(true); // Mark upload as complete
    } catch (err: any) {
      console.error("Upload failed:", err);
      setError("Failed to upload and process the file. Please try again.");
      setUploadComplete(false); // Ensure it's false on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10">
      <div className="w-full max-w-5xl p-8 bg-white rounded-lg shadow-lg">
        <div className="flex items-center mb-6">
          <MdOutlineLocalHospital size={40} className="text-blue-500 mr-3" />
          <h1 className="text-3xl font-bold text-gray-800">
            Medical ORU Upload
          </h1>
        </div>

        <p className="text-gray-600 mb-6">
          Welcome! Please upload the ORU file to review your patient's test
          results
        </p>

        {error && (
          <div className="mb-4 text-red-600 font-medium bg-red-100 border border-red-300 p-3 rounded">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label
            htmlFor="fileInput"
            className="block text-gray-700 text-lg font-medium mb-2"
          >
            Select ORU File (TXT format)
          </label>
          <input
            id="fileInput"
            type="file"
            accept=".txt"
            onChange={handleFileChange}
            className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleUpload}
            disabled={loading}
            className={`px-6 py-2 ${
              loading ? "bg-blue-300" : "bg-blue-600 hover:bg-blue-700"
            } text-white font-semibold rounded-lg transition-colors`}
          >
            {loading ? "Processing..." : "Upload"}
          </button>
        </div>

        {/* Message shown only after upload is complete and no results */}
        {uploadComplete &&
          !loading &&
          !error &&
          file &&
          patients.length === 0 && (
            <div className="mt-10 text-gray-600 bg-yellow-50 border border-yellow-300 p-4 rounded-lg">
              ✅ File uploaded successfully, but no high-risk test results were
              found.
            </div>
          )}

        {/* Patient data table */}
        {patients.length > 0 && (
          <div className="mt-10 space-y-10">
            {patients.map((patient, index) => (
              <div key={index}>
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                  Patient: {patient.patientName}
                </h2>
                <p className="text-gray-600 mb-4">
                  DOB: {patient.dob} | Gender: {patient.gender} | ID:{" "}
                  {patient.patientId}
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full table-auto border border-collapse">
                    <thead>
                      <tr className="bg-blue-100">
                        <th className="border px-4 py-2 text-left">
                          Test Name
                        </th>
                        <th className="border px-4 py-2 text-left">Result</th>
                        <th className="border px-4 py-2 text-left">Units</th>
                        <th className="border px-4 py-2 text-left">
                          Ref Range
                        </th>
                        <th className="border px-4 py-2 text-left">Flag</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patient.highRiskResults.map((result, idx) => (
                        <tr key={idx} className="hover:bg-gray-100">
                          <td className="border px-4 py-2">
                            {result.matchedMetric}
                          </td>
                          <td className="border px-4 py-2">{result.result}</td>
                          <td className="border px-4 py-2">{result.units}</td>
                          <td className="border px-4 py-2">
                            {result.referenceRange}
                          </td>
                          <td
                            className={`border px-4 py-2 font-bold rounded ${
                              result.flag.toLocaleLowerCase() === "high"
                                ? "text-red-700 bg-red-50"
                                : result.flag.toLocaleLowerCase() === "low"
                                ? "text-blue-700 bg-blue-50"
                                : result.flag.toLocaleLowerCase() === "normal"
                                ? "text-green-700 bg-green-50"
                                : "text-gray-700"
                            }`}
                          >
                            {result.flag}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}