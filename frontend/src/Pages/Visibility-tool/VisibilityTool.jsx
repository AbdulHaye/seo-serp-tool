import React, { useState, useEffect } from "react";
import axios from "axios";
import "./visibilityTool.css";
import { FaDownload } from "react-icons/fa";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function VisibilityTool() {
  const [singleFormData, setSingleFormData] = useState({
    keyword: "",
    location_code: "",
    language_name: "",
    device: "",
    os: "",
  });

  const [multiFormData, setMultiFormData] = useState({
    keyword: "",
    location_codes: [""],
    language_name: "",
    device: "",
    os: "",
  });

  const [singleResponse, setSingleResponse] = useState(null);
  const [multiResponse, setMultiResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMultiForm, setLoadingMultiForm] = useState(false);
  const [error, setError] = useState(null);
  const [errorMultiForm, setErrorMultiForm] = useState(null);
  const [activeTab, setActiveTab] = useState("single");
  const [screenshotStatus, setScreenshotStatus] = useState([]); // Add state for screenshot status

  const handleSingleChange = (e) => {
    const { name, value } = e.target;
    setSingleFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMultiChange = (e, index = null) => {
    const { name, value } = e.target;
    if (name === "location_codes") {
      const updatedLocations = [...multiFormData.location_codes];
      updatedLocations[index] = value;
      setMultiFormData((prev) => ({
        ...prev,
        location_codes: updatedLocations,
      }));
    } else {
      setMultiFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const addLocationField = () => {
    setMultiFormData((prev) => ({
      ...prev,
      location_codes: [...prev.location_codes, ""],
    }));
  };

  const removeLocationField = (index) => {
    if (multiFormData.location_codes.length > 1) {
      setMultiFormData((prev) => {
        const updatedLocations = [...prev.location_codes];
        updatedLocations.splice(index, 1);
        return { ...prev, location_codes: updatedLocations };
      });
    }
  };

  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSingleResponse(null);
    try {
      console.log("Submitting Single Form:", singleFormData);
      const res = await axios.post("/api/search/get-results", singleFormData);
      console.log("Single API Response:", res.data);
      const response = res.data.searchData?.results || null;
      if (!response || Object.keys(response).length === 0) {
        setError("No results found for the provided inputs.");
      } else {
        setSingleResponse(response);
        setSingleFormData({
          keyword: "",
          location_code: "",
          language_name: "",
          device: "",
          os: "",
        });
      }
    } catch (err) {
      console.error("Error fetching single search results:", err);
      setError(
        err.response?.data?.message || "Error fetching results. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMultiSubmit = async (e) => {
    e.preventDefault();
    setLoadingMultiForm(true);
    setErrorMultiForm(null);
    setMultiResponse(null);
    try {
      console.log("Submitting Multi Form:", multiFormData);
      const res = await axios.post(
        "/api/search/analyze-multi-location",
        multiFormData
      );
      console.log("Multi API Response:", res.data);
      const response = res.data.rankings || null;
      if (!response || Object.keys(response).length === 0) {
        setErrorMultiForm("No results found for the provided inputs.");
      } else {
        setMultiResponse(response);
        setMultiFormData({
          keyword: "",
          location_codes: [""],
          language_name: "",
          device: "",
          os: "",
        });
      }
    } catch (err) {
      console.error("Error fetching multi-location results:", err);
      setErrorMultiForm(
        err.response?.data?.message ||
          "Error fetching results. Please try again."
      );
    } finally {
      setLoadingMultiForm(false);
    }
  };

  const generateCSV = (data, headers) => {
    const csvRows = [];
    csvRows.push(headers.join(","));
    data.forEach((item) => {
      const values = headers.map((header) => {
        let value = item[header];
        if (value == null) value = "";
        if (
          typeof value === "string" &&
          (value.includes(",") || value.includes('"'))
        ) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvRows.push(values.join(","));
    });
    return csvRows.join("\n");
  };

  const downloadCSV = (csvString, fileName) => {
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadAllDataCSV = () => {
    const csvRows = [];
    const singleHeaders = [
      "category",
      "position",
      "title",
      "url",
      "meta_title",
      "meta_description",
    ];
    const multiHeaders = ["location_code", "position", "title", "url"];

    if (singleResponse) {
      csvRows.push("Single Location Results");
      csvRows.push(singleHeaders.join(","));
      Object.entries(singleResponse).forEach(([category, results]) => {
        results.forEach((result) => {
          const values = singleHeaders.map((header) => {
            let value = header === "category" ? category : result[header];
            if (value == null) value = "";
            if (
              typeof value === "string" &&
              (value.includes(",") || value.includes('"'))
            ) {
              value = `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          });
          csvRows.push(values.join(","));
        });
      });
      csvRows.push("");
    }

    if (multiResponse) {
      csvRows.push("Multi-Location Results");
      csvRows.push(multiHeaders.join(","));
      Object.entries(multiResponse).forEach(([locationCode, entries]) => {
        entries.forEach((entry) => {
          const values = multiHeaders.map((header) => {
            let value =
              header === "location_code" ? locationCode : entry[header];
            if (value == null) value = "";
            if (
              typeof value === "string" &&
              (value.includes(",") || value.includes('"'))
            ) {
              value = `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          });
          csvRows.push(values.join(","));
        });
      });
    }

    const csvString = csvRows.join("\n");
    downloadCSV(csvString, "all_search_results.csv");
  };

  const downloadAllDataPDF = () => {
    const doc = new jsPDF();
    const margin = 10;
    let y = margin;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Search Visibility Report", margin, y);
    y += 10;

    if (singleResponse) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Single Location Results", margin, y);
      y += 7;

      Object.entries(singleResponse).forEach(([category, results]) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(`Category: ${category.replace("_", " ")}`, margin, y);
        y += 5;

        results.forEach((result) => {
          if (y > 280) {
            doc.addPage();
            y = margin;
          }
          doc.setFont("helvetica", "bold");
          doc.text(`Position:`, margin, y);
          doc.setFont("helvetica", "normal");
          doc.text(`${result.position}`, margin + 25, y);
          y += 5;
          doc.setFont("helvetica", "bold");
          doc.text(`Title:`, margin, y);
          doc.setFont("helvetica", "normal");
          doc.text(`${result.title || "N/A"}`, margin + 25, y);
          y += 5;
          doc.setFont("helvetica", "bold");
          doc.text(`URL:`, margin, y);
          doc.setFont("helvetica", "normal");
          doc.text(`${result.url || "N/A"}`, margin + 25, y);
          y += 5;
          doc.setFont("helvetica", "bold");
          doc.text(`Meta Title:`, margin, y);
          doc.setFont("helvetica", "normal");
          doc.text(`${result.meta_title || "N/A"}`, margin + 25, y);
          y += 5;
          doc.setFont("helvetica", "bold");
          doc.text(`Meta Description:`, margin, y);
          doc.setFont("helvetica", "normal");
          doc.text(`${result.meta_description || "N/A"}`, margin + 25, y);
          y += 7;
        });
        y += 5;
      });
    }

    if (multiResponse) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Multi-Location Results", margin, y);
      y += 7;

      Object.entries(multiResponse).forEach(([locationCode, entries]) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(`Location Code: ${locationCode}`, margin, y);
        y += 5;

        entries.forEach((entry) => {
          if (y > 280) {
            doc.addPage();
            y = margin;
          }
          doc.setFont("helvetica", "bold");
          doc.text(`Position:`, margin, y);
          doc.setFont("helvetica", "normal");
          doc.text(`${entry.position}`, margin + 25, y);
          y += 5;
          doc.setFont("helvetica", "bold");
          doc.text(`Title:`, margin, y);
          doc.setFont("helvetica", "normal");
          doc.text(
            `${entry.title !== "No Title" ? entry.title : "N/A"}`,
            margin + 25,
            y
          );
          y += 5;
          doc.setFont("helvetica", "bold");
          doc.text(`URL:`, margin, y);
          doc.setFont("helvetica", "normal");
          doc.text(`${entry.url || "N/A"}`, margin + 25, y);
          y += 5;
        });
        y += 5;
      });
    }

    doc.save("all_search_results.pdf");
  };

  const groupedResults = {};
  const searchEngines = {
    desktop: "Google Desktop",
    mobile: "Google Mobile",
    maps: "Google Maps",
    bing: "Bing",
    perplexity: "Perplexity",
  };

  if (singleResponse) {
    Object.entries(singleResponse).forEach(([category, results]) => {
      const engine = searchEngines[category] || category;
      if (!groupedResults[engine]) {
        groupedResults[engine] = [];
      }
      groupedResults[engine] = [...groupedResults[engine], ...results];
    });
  }

  if (multiResponse) {
    Object.entries(multiResponse).forEach(([locationCode, entries]) => {
      const device = multiFormData.device || "desktop";
      const engine = searchEngines[device] || device;
      const engineWithLocation = `${engine} - Location: ${locationCode}`;
      if (!groupedResults[engineWithLocation]) {
        groupedResults[engineWithLocation] = [];
      }
      groupedResults[engineWithLocation] = [
        ...groupedResults[engineWithLocation],
        ...entries,
      ];
    });
  }

  useEffect(() => {
    if (singleResponse || multiResponse) {
      setScreenshotStatus([]); // Reset status
      const takeScreenshots = () => {
        const targets = document.querySelectorAll(".screenshot-target");
        targets.forEach((target) => {
          html2canvas(target).then((canvas) => {
            const image = canvas.toDataURL("image/png");
            const type = target.querySelector("h4")?.textContent || "unknown";
            setScreenshotStatus((prev) => [
              ...prev,
              { type, status: "Saving..." },
            ]);
            axios
              .post("/api/save-screenshot", { image, type })
              .then(() => {
                console.log(`Screenshot saved for type: ${type}`);
                setScreenshotStatus((prev) =>
                  prev.map((item) =>
                    item.type === type
                      ? { ...item, status: "Saved" }
                      : item
                  )
                );
              })
              .catch((err) => {
                console.error("Error saving screenshot:", err);
                setScreenshotStatus((prev) =>
                  prev.map((item) =>
                    item.type === type
                      ? { ...item, status: "Failed" }
                      : item
                  )
                );
              });
          });
        });
      };
      takeScreenshots();
    }
  }, [singleResponse, multiResponse]);

  return (
    <>
      <div className="container main-container-form">
        <div className="form-container1">
          <div className="tabs">
            <button
              className={`tab ${activeTab === "single" ? "active" : ""}`}
              onClick={() => setActiveTab("single")}
            >
              Search Visibility Tool
            </button>
            <button
              className={`tab ${activeTab === "multi" ? "active" : ""}`}
              onClick={() => setActiveTab("multi")}
            >
              Analyze Multi Location
            </button>
          </div>

          <div className="form-content">
            {activeTab === "single" && (
              <form onSubmit={handleSingleSubmit} className="formsub">
                <div className="scrollable-form">
                  <div className="form-row">
                    <input
                      type="text"
                      className="form-control form-input"
                      name="keyword"
                      value={singleFormData.keyword}
                      onChange={handleSingleChange}
                      placeholder="Keyword"
                      required
                    />
                  </div>

                  <div className="form-row">
                    <input
                      type="number"
                      className="form-control form-input"
                      name="location_code"
                      value={singleFormData.location_code}
                      onChange={handleSingleChange}
                      placeholder="Location Code"
                      required
                    />
                  </div>

                  <div className="form-row">
                    <select
                      className="form-control form-input"
                      name="language_name"
                      value={singleFormData.language_name}
                      onChange={handleSingleChange}
                      required
                    >
                      <option value="">Select Language</option>
                      <option value="English">English</option>
                    </select>
                  </div>

                  <div className="form-row">
                    <select
                      className="form-control form-input"
                      name="device"
                      value={singleFormData.device}
                      onChange={handleSingleChange}
                      required
                    >
                      <option value="">Select Device</option>
                      <option value="desktop">Desktop</option>
                      <option value="mobile">Mobile</option>
                      <option value="tablet">Tablet</option>
                    </select>
                  </div>

                  <div className="form-row">
                    <select
                      className="form-control form-input"
                      name="os"
                      value={singleFormData.os}
                      onChange={handleSingleChange}
                      required
                    >
                      <option value="">Select OS</option>
                      <option value="windows">Windows</option>
                      <option value="macos">macOS</option>
                      <option value="linux">Linux</option>
                      <option value="ios">iOS</option>
                      <option value="android">Android</option>
                    </select>
                  </div>
                </div>
                <div className="submit-btn-container d-flex justify-content-end">
                  <button
                    type="submit"
                    className="submit-button"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="spinner-border" role="status"></div>
                    ) : (
                      "Search"
                    )}
                  </button>
                </div>
              </form>
            )}

            {activeTab === "multi" && (
              <form onSubmit={handleMultiSubmit}>
                <div className="scrollable-form">
                  <div className="form-row">
                    <input
                      type="text"
                      className="form-control form-input"
                      name="keyword"
                      value={multiFormData.keyword}
                      onChange={handleMultiChange}
                      placeholder="Keyword"
                      required
                    />
                  </div>

                  {multiFormData.location_codes.map((code, index) => (
                    <div className="form-row position-relative" key={index}>
                      <input
                        type="number"
                        className="form-control form-input location-input"
                        name="location_codes"
                        value={code}
                        onChange={(e) => handleMultiChange(e, index)}
                        placeholder="Location Code"
                        required
                      />
                      <div className="location-buttons">
                        {index === multiFormData.location_codes.length - 1 && (
                          <button
                            type="button"
                            className="add-location-btn"
                            onClick={addLocationField}
                          >
                            +
                          </button>
                        )}
                        <button
                          type="button"
                          className="remove-location-btn"
                          onClick={() => removeLocationField(index)}
                          disabled={multiFormData.location_codes.length === 1}
                        >
                          −
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="form-row">
                    <select
                      className="form-control form-input"
                      name="language_name"
                      value={multiFormData.language_name}
                      onChange={handleMultiChange}
                      required
                    >
                      <option value="">Select Language</option>
                      <option value="English">English</option>
                    </select>
                  </div>

                  <div className="form-row">
                    <select
                      className="form-control form-input"
                      name="device"
                      value={multiFormData.device}
                      onChange={handleMultiChange}
                      required
                    >
                      <option value="">Select Device</option>
                      <option value="desktop">Desktop</option>
                      <option value="mobile">Mobile</option>
                      <option value="tablet">Tablet</option>
                    </select>
                  </div>

                  <div className="form-row">
                    <select
                      className="form-control form-input"
                      name="os"
                      value={multiFormData.os}
                      onChange={handleMultiChange}
                      required
                    >
                      <option value="">Select OS</option>
                      <option value="windows">Windows</option>
                      <option value="macos">macOS</option>
                      <option value="linux">Linux</option>
                      <option value="ios">iOS</option>
                      <option value="android">Android</option>
                    </select>
                  </div>
                  <div className="submit-btn-container d-flex justify-content-end">
                    <button
                      type="submit"
                      className="submit-button"
                      disabled={loadingMultiForm}
                    >
                      {loadingMultiForm ? (
                        <div className="spinner-border" role="status"></div>
                      ) : (
                        "Search"
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <div className="container output-container">
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        {errorMultiForm && (
          <div className="alert alert-danger" role="alert">
            {errorMultiForm}
          </div>
        )}
        {screenshotStatus.length > 0 && (
          <div className="alert alert-info" role="alert">
            <h5>Screenshot Status:</h5>
            <ul>
              {screenshotStatus.map((status, index) => (
                <li key={index}>
                  {status.type}: {status.status}
                </li>
              ))}
            </ul>
          </div>
        )}
        {Object.keys(groupedResults).length > 0 && (
          <>
            {Object.entries(groupedResults).map(([engine, results]) => (
              <div key={engine} className="mb-4 screenshot-target">
                <h4 className="category-header">{engine}</h4>
                <div className="table-responsive">
                  <table className="result-table">
                    <thead>
                      <tr>
                        <th>Position</th>
                        <th>Title</th>
                        <th>URL</th>
                        <th>Meta Title</th>
                        <th>Meta Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((result, index) => (
                        <tr key={index}>
                          <td>{result.position}</td>
                          <td>{result.title || "N/A"}</td>
                          <td>
                            <a
                              href={result.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="url-link"
                            >
                              {result.url
                                ? `${result.url.slice(0, 30)}${
                                    result.url.length > 30 ? "..." : ""
                                  }`
                                : "N/A"}
                            </a>
                          </td>
                          <td>{result.meta_title || "N/A"}</td>
                          <td>{result.meta_description || "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </>
        )}
        {(singleResponse || multiResponse) && (
          <div className="download-buttons">
            <button className="download-btn csv-btn" onClick={downloadAllDataCSV}>
              <FaDownload className="me-2" /> Download as CSV
            </button>
            <button className="download-btn pdf-btn" onClick={downloadAllDataPDF}>
              <FaDownload className="me-2" /> Download as PDF
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default VisibilityTool;