import React, { useState, useEffect } from "react";
import axios from "axios";
import "./ranking.css";
import { FaDownload, FaPlus, FaMinus } from "react-icons/fa";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function Ranking() {
  const [keyword, setKeyword] = useState("");
  const [locations, setLocations] = useState([{ lat: "", lon: "" }]);
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleKeywordChange = (e) => {
    setKeyword(e.target.value);
  };

  const handleLocationChange = (index, field, value) => {
    const updatedLocations = [...locations];
    updatedLocations[index][field] = value;
    setLocations(updatedLocations);
  };

  const addLocation = () => {
    setLocations([...locations, { lat: "", lon: "" }]);
  };

  const removeLocation = (index) => {
    if (locations.length > 1) {
      const updatedLocations = locations.filter((_, i) => i !== index);
      setLocations(updatedLocations);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setRankings([]);

    const hasEmptyFields = locations.some((loc) => !loc.lat || !loc.lon);
    if (!keyword || hasEmptyFields) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    const payload = {
      keyword,
      locations: locations.map((loc) => ({
        lat: parseFloat(loc.lat),
        lon: parseFloat(loc.lon),
      })),
    };

    try {
      const response = await axios.post("/api/search/phase2/rankings", payload);
      setRankings(response.data.data);
    } catch (err) {
      setError("Failed to fetch rankings. Please try again.");
    } finally {
      setLoading(false);
      // Reset form fields after submission
      setKeyword("");
      setLocations([{ lat: "", lon: "" }]);
    }
  };

  const generateCSV = () => {
    const headers = [
      "GPS Location",
      "Position",
      "Title",
      "Address",
      "Phone",
      "Description",
      "Rating",
      "Votes",
      "C_ID",
      "Rank Group",
      "Rank Absolute",
      "Position Type",
      "X path",
      "Latitude",
      "Longitude",
    ];
    const csvRows = [];
    csvRows.push(headers.join(","));

    rankings.forEach((item) => {
      const gpsLocation = `Lat: ${item.lat ?? "N/A"}, Lon: ${item.lon ?? "N/A"}`;
      const values = [
        `"${gpsLocation.replace(/"/g, '""')}"`,
        item.position ?? "N/A",
        `"${(item.title ?? "N/A").replace(/"/g, '""')}"`,
        `"${(item.address ?? "N/A").replace(/"/g, '""')}"`,
        `"${(item.phone ?? "N/A").replace(/"/g, '""')}"`,
        `"${(item.description ?? "N/A").replace(/"/g, '""')}"`,
        item.rating ?? "N/A",
        item.votes ?? "N/A",
        `"${(item.cid ?? "N/A").replace(/"/g, '""')}"`,
        item.rank_group ?? "N/A",
        item.rank_absolute ?? "N/A",
        `"${(item.position_type ?? "N/A").replace(/"/g, '""')}"`,
        `"${(item.xpath ?? "N/A").replace(/"/g, '""')}"`,
        item.lat ?? "N/A",
        item.lon ?? "N/A",
      ];
      csvRows.push(values.join(","));
    });

    return csvRows.join("\n");
  };

  const downloadCSV = () => {
    const csvString = generateCSV();
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "search_rankings.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    const margin = 10;
    let y = margin;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Search Rankings Report", margin, y);
    y += 10;

    const groupedRankings = rankings.reduce((acc, item) => {
      const key = `Lat: ${item.lat ?? "N/A"}, Lon: ${item.lon ?? "N/A"}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});

    Object.entries(groupedRankings).forEach(([gpsLocation, items], groupIndex) => {
      if (y > 280) {
        doc.addPage();
        y = margin;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(`Location ${groupIndex + 1}: ${gpsLocation}`, margin, y);
      y += 7;

      items.forEach((item, index) => {
        if (y > 280) {
          doc.addPage();
          y = margin;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(`Result ${index + 1}:`, margin, y);
        y += 5;

        const fields = [
          { label: "Position:", value: item.position ?? "N/A" },
          { label: "Title:", value: item.title ?? "N/A" },
          { label: "Address:", value: item.address ?? "N/A" },
          { label: "Phone:", value: item.phone ?? "N/A" },
          { label: "Description:", value: item.description ?? "N/A" },
          { label: "Rating:", value: item.rating ?? "N/A" },
          { label: "Votes:", value: item.votes ?? "N/A" },
          { label: "C_ID:", value: item.cid ?? "N/A" },
          { label: "Rank Group:", value: item.rank_group ?? "N/A" },
          { label: "Rank Absolute:", value: item.rank_absolute ?? "N/A" },
          { label: "Position Type:", value: item.position_type ?? "N/A" },
          { label: "X path:", value: item.xpath ?? "N/A" },
          { label: "Latitude:", value: item.lat ?? "N/A" },
          { label: "Longitude:", value: item.lon ?? "N/A" },
        ];

        fields.forEach((field) => {
          if (y > 280) {
            doc.addPage();
            y = margin;
          }
          doc.setFont("helvetica", "bold");
          doc.text(field.label, margin, y);
          doc.setFont("helvetica", "normal");
          const lines = doc.splitTextToSize(field.value, 170);
          lines.forEach((line, lineIndex) => {
            if (y > 280) {
              doc.addPage();
              y = margin;
            }
            doc.text(line, margin + 25, y);
            y += 5;
          });
        });
        y += 5;
      });
      y += 5;
    });

    doc.save("search_rankings.pdf");
  };

  const groupedRankings = rankings.reduce((acc, item) => {
    const key = `Lat: ${item.lat ?? "N/A"}, Lon: ${item.lon ?? "N/A"}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const renderComparisonTable = () => {
    const locationKeys = Object.keys(groupedRankings);
    if (locationKeys.length !== 3) return null;

    const maxResults = Math.max(...locationKeys.map((key) => groupedRankings[key].length));

    return (
      <div className="comparison-table-container screenshot-target">
        <h3 className="insights-heading">Search Rankings Comparison:</h3>
        <div className="comparison-table">
          {locationKeys.map((key, index) => (
            <div key={index} className="location-column">
              <h4 className="location-heading">{`Location ${index + 1}: ${key}`}</h4>
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Position</th>
                      <th>Title</th>
                      <th>Address</th>
                      <th>Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedRankings[key].map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.position ?? "N/A"}</td>
                        <td>{item.title ?? "N/A"}</td>
                        <td>{item.address ?? "N/A"}</td>
                        <td>{item.rating ?? "N/A"}</td>
                      </tr>
                    ))}
                    {Array.from({ length: maxResults - groupedRankings[key].length }).map((_, idx) => (
                      <tr key={`empty-${idx}`}>
                        <td>-</td>
                        <td>-</td>
                        <td>-</td>
                        <td>-</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDefaultTables = () => (
    <div className="insights">
      <h3 className="insights-heading">Search Rankings:</h3>
      {Object.entries(groupedRankings).map(([gpsLocation, items], groupIndex) => (
        <div key={groupIndex} className="location-group screenshot-target">
          <h4 className="location-heading">{`Location ${groupIndex + 1}: ${gpsLocation}`}</h4>
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Position</th>
                  <th>Title</th>
                  <th>Address</th>
                  <th>Phone</th>
                  <th>Description</th>
                  <th>Rating</th>
                  <th>Votes</th>
                  <th>C_ID</th>
                  <th>Rank Group</th>
                  <th>Rank Absolute</th>
                  <th>Position Type</th>
                  <th>X path</th>
                  <th>Latitude</th>
                  <th>Longitude</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index}>
                    <td>{item.position ?? "N/A"}</td>
                    <td>{item.title ?? "N/A"}</td>
                    <td>{item.address ?? "N/A"}</td>
                    <td>{item.phone ?? "N/A"}</td>
                    <td title={item.description}>
                      {item.description ? item.description.slice(0, 30) + "..." : "N/A"}
                    </td>
                    <td>{item.rating ?? "N/A"}</td>
                    <td>{item.votes ?? "N/A"}</td>
                    <td>{item.cid ?? "N/A"}</td>
                    <td>{item.rank_group ?? "N/A"}</td>
                    <td>{item.rank_absolute ?? "N/A"}</td>
                    <td>{item.position_type ?? "N/A"}</td>
                    <td title={item.xpath}>
                      {item.xpath ? item.xpath.slice(0, 30) + "..." : "N/A"}
                    </td>
                    <td>{item.lat ?? "N/A"}</td>
                    <td>{item.lon ?? "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );

  useEffect(() => {
    if (rankings.length > 0) {
      const takeScreenshots = () => {
        const targets = document.querySelectorAll(".screenshot-target");
        targets.forEach((target) => {
          html2canvas(target).then((canvas) => {
            const image = canvas.toDataURL("image/png");
            const type = target.querySelector("h4")?.textContent || "ranking-unknown";
            axios.post("/api/save-screenshot", { image, type })
              .catch((err) => console.error("Error saving screenshot:", err));
          });
        });
      };
      takeScreenshots();
    }
  }, [rankings]);

  return (
    <div className="main-wrapper">
      <div className="form-container">
        <h3 className="form-heading">Search Rankings</h3>
        <form onSubmit={handleSubmit} className="form-content">
          <div className="form-row">
            <input
              type="text"
              className="form-control form-input"
              value={keyword}
              onChange={handleKeywordChange}
              placeholder="Keyword"
              required
            />
          </div>

          {locations.map((loc, index) => (
            <div key={index} className="form-row location-row">
              <div className="location-controls">
                <button
                  type="button"
                  className="location-btn location-btn-add"
                  onClick={addLocation}
                >
                  <FaPlus />
                </button>
                <button
                  type="button"
                  className="location-btn location-btn-remove"
                  onClick={() => removeLocation(index)}
                  disabled={locations.length === 1}
                >
                  <FaMinus />
                </button>
              </div>
              <div className="location-inputs">
                <div className="location-field">
                  <input
                    type="number"
                    className="form-control form-input"
                    value={loc.lat}
                    onChange={(e) => handleLocationChange(index, "lat", e.target.value)}
                    placeholder="Latitude"
                    required
                  />
                </div>
                <div className="location-field">
                  <input
                    type="number"
                    className="form-control form-input"
                    value={loc.lon}
                    onChange={(e) => handleLocationChange(index, "lon", e.target.value)}
                    placeholder="Longitude"
                    required
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="submit-btn-container d-flex justify-content-end">
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? (
                <div className="spinner-border" role="status"></div>
              ) : (
                "Search"
              )}
            </button>
          </div>
        </form>
        {error && <div className="error-message">{error}</div>}
      </div>

      {rankings.length > 0 && (
        <div className="insights-container">
          {Object.keys(groupedRankings).length === 3
            ? renderComparisonTable()
            : renderDefaultTables()}
          <div className="download-buttons-footer">
            <button className="btn btn-secondary me-2" onClick={downloadCSV}>
              <FaDownload className="me-2" /> Download as CSV
            </button>
            <button className="btn btn-secondary" onClick={downloadPDF}>
              <FaDownload className="me-2" /> Download as PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Ranking;