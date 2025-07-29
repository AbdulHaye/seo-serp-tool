import React, { useState, useEffect } from "react";
import axios from "axios";
import "./competitors.css";
import { FaDownload } from 'react-icons/fa';
import jsPDF from 'jspdf';
import html2canvas from "html2canvas";

function Competitors() {
    const [competitor1, setCompetitor1] = useState({ title: "", url: "", meta_description: "" });
    const [competitor2, setCompetitor2] = useState({ title: "", url: "", meta_description: "" });
    const [insights, setInsights] = useState("");
    const [loading, setLoading] = useState(false);
    const [activeCompetitor, setActiveCompetitor] = useState("competitor1");

    const handleChange = (e, competitor) => {
        const { name, value } = e.target;
        if (competitor === "competitor1") {
            setCompetitor1((prev) => ({ ...prev, [name]: value }));
        } else {
            setCompetitor2((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setInsights("");

        const payload = {
            searchResults: [competitor1, competitor2],
        };

        try {
            const response = await axios.post(
                "/api/search/analyze-ai-patterns",
                payload
            );
            setInsights(response.data.insights);
        } catch (error) {
            console.error("Error fetching insights:", error);
            setInsights("Error fetching insights. Please try again.");
        } finally {
            setLoading(false);
            // Reset form fields after submission
            setCompetitor1({ title: "", url: "", meta_description: "" });
            setCompetitor2({ title: "", url: "", meta_description: "" });
        }
    };

    const downloadPDF = () => {
        const doc = new jsPDF();
        const margin = 10;
        let y = margin;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text("Competitor Comparison Report", margin, y);
        y += 10;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("Competitor 1", margin, y);
        y += 7;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Title: ${competitor1.title}`, margin, y);
        y += 5;
        doc.text(`URL: ${competitor1.url}`, margin, y);
        y += 5;
        doc.text(`Meta Description: ${competitor1.meta_description}`, margin, y);
        y += 10;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("Competitor 2", margin, y);
        y += 7;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Title: ${competitor2.title}`, margin, y);
        y += 5;
        doc.text(`URL: ${competitor2.url}`, margin, y);
        y += 5;
        doc.text(`Meta Description: ${competitor2.meta_description}`, margin, y);
        y += 10;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("SEO Insights:", margin, y);
        y += 7;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        const lines = doc.splitTextToSize(insights, 190);
        lines.forEach(line => {
            if (y > 280) {
                doc.addPage();
                y = margin;
            }
            doc.text(line, margin, y);
            y += 5;
        });

        doc.save('competitor_comparison.pdf');
    };

    useEffect(() => {
      if (insights) {
        const takeScreenshot = () => {
          const target = document.querySelector(".screenshot-target");
          if (target) {
            html2canvas(target).then((canvas) => {
              const image = canvas.toDataURL("image/png");
              axios.post("/api/save-screenshot", { image, type: "competitors-insights" })
                .catch((err) => console.error("Error saving screenshot:", err));
            });
          }
        };
        takeScreenshot();
      }
    }, [insights]);

    return (
        <div className="main-wrapper">
            <div className="content-container">
                <div className="form-container">
                    <div className="tabs">
                        <button
                            className={`tab ${activeCompetitor === "competitor1" ? "active" : ""}`}
                            onClick={() => setActiveCompetitor("competitor1")}
                        >
                            Competitor 1
                        </button>
                        <button
                            className={`tab ${activeCompetitor === "competitor2" ? "active" : ""}`}
                            onClick={() => setActiveCompetitor("competitor2")}
                        >
                            Competitor 2
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="form-content">
                        {activeCompetitor === "competitor1" && (
                            <div className="competitor">
                                <div className="form-row">
                                    <input
                                        type="text"
                                        className="form-control form-input"
                                        name="title"
                                        value={competitor1.title}
                                        onChange={(e) => handleChange(e, "competitor1")}
                                        placeholder="Title"
                                        required
                                    />
                                </div>
                                <div className="form-row">
                                    <input
                                        type="url"
                                        className="form-control form-input"
                                        name="url"
                                        value={competitor1.url}
                                        onChange={(e) => handleChange(e, "competitor1")}
                                        placeholder="URL"
                                        required
                                    />
                                </div>
                                <div className="form-row">
                                    <input
                                        type="text"
                                        className="form-control form-input"
                                        name="meta_description"
                                        value={competitor1.meta_description}
                                        onChange={(e) => handleChange(e, "competitor1")}
                                        placeholder="Meta Description"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        {activeCompetitor === "competitor2" && (
                            <div className="competitor">
                                <div className="form-row">
                                    <input
                                        type="text"
                                        className="form-control form-input"
                                        name="title"
                                        value={competitor2.title}
                                        onChange={(e) => handleChange(e, "competitor2")}
                                        placeholder="Title"
                                        required
                                    />
                                </div>
                                <div className="form-row">
                                    <input
                                        type="url"
                                        className="form-control form-input"
                                        name="url"
                                        value={competitor2.url}
                                        onChange={(e) => handleChange(e, "competitor2")}
                                        placeholder="URL"
                                        required
                                    />
                                </div>
                                <div className="form-row">
                                    <input
                                        type="text"
                                        className="form-control form-input"
                                        name="meta_description"
                                        value={competitor2.meta_description}
                                        onChange={(e) => handleChange(e, "competitor2")}
                                        placeholder="Meta Description"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <div className="submit-btn-container d-flex justify-content-end">
                            <button
                                type="submit"
                                className="submit-button"
                                disabled={loading}
                            >
                                {loading ? (
                                    <div className="spinner-border" role="status"></div>
                                ) : "Compare"}
                            </button>
                        </div>
                    </form>
                </div>

                {insights && (
                    <div className="insights-container">
                        <div className="insights screenshot-target">
                            <h3 className="insights-heading">SEO Insights:</h3>
                            {insights.split("\n").map((line, index) => (
                                <p key={index}>{line}</p>
                            ))}
                        </div>
                        <div className="download-buttons-footer">
                            <button
                                className="btn btn-secondary"
                                onClick={downloadPDF}
                            >
                                <FaDownload className="me-2" /> Download as PDF
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Competitors;