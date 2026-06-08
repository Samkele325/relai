"use client";

import { useEffect, useState } from "react";
import "./result.css";

export default function ResultPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const raw = localStorage.getItem("relocation_analysis_result");

    if (raw) {
      setData(JSON.parse(raw));
    }
  }, []);

  const fillList = (items: string[]) => {
    if (!items || items.length === 0) {
      return <li>No information available.</li>;
    }

    return items.map((item, index) => (
      <li key={index}>{item}</li>
    ));
  };

  return (
    <div className="container">
      {/* HERO */}

      <div className="hero">
        <small>🤖 AI Relocation Intelligence</small>

        <h1>Your Personalized Relocation Result</h1>

        <p id="intro">
          {!data
            ? "No relocation analysis found. Please complete the questionnaire first."
            : "Your AI-powered relocation roadmap is ready. Here’s the country and visa pathway that best match your background, finances, goals, and career profile."}
        </p>
      </div>

      {/* MAIN COUNTRY RESULT */}

      <div className="country-card">
        <div className="country-left">
          <h2>🌍 Recommended Destination</h2>

          <div className="country-name" id="country">
            {data ? data.best_country_match.country : "—"}
          </div>

          <div className="country-score" id="countryScore">
            {data
              ? `Match Score: ${data.best_country_match.score}/100`
              : "Match Score: —"}
          </div>
        </div>

        <div className="confidence-box">
          <h3>AI Recommendation Confidence</h3>

          <div className="confidence-number" id="confidence">
            {data ? `${data.confidence}%` : "—"}
          </div>

          <div className="confidence-bar">
            <div
              className="confidence-fill"
              id="confidenceFill"
              style={{
                width: data ? `${data.confidence}%` : "0%",
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* GRID */}

      <div className="grid">
        {/* WHY FITS */}

        <div className="card">
          <div className="card-icon">✨</div>

          <h2>Why This Match Fits You</h2>

          <p id="countryWhy">
            {data
              ? data.best_country_match.why_it_fits.join(" ")
              : ""}
          </p>
        </div>

        {/* VISA */}

        <div className="card">
          <div className="card-icon">🛂</div>

          <h2>Recommended Visa Pathway</h2>

          <div className="badge" id="visa">
            {data ? data.recommended_visa_pathway.name : "—"}
          </div>

          <p id="visaWhy">
            {data
              ? data.recommended_visa_pathway.why_this_pathway.join(" ")
              : ""}
          </p>
        </div>

        {/* TIMELINE */}

        <div className="card">
          <div className="card-icon">⏳</div>

          <h2>Estimated Timeline</h2>

          <div className="timeline">
            <div className="timeline-number" id="timeline">
              {data
                ? data.estimated_timeline || "8–14 months"
                : "—"}
            </div>
          </div>

          <p className="timeline-text">
            Estimated processing time based on your current profile and pathway.
          </p>
        </div>

        {/* COST */}

        <div className="card">
          <div className="card-icon">💰</div>

          <h2>Estimated Costs</h2>

          <div className="badge" id="cost">
            {data
              ? `${data.estimated_cost.currency} ${data.estimated_cost.min.toLocaleString()} – ${data.estimated_cost.max.toLocaleString()}`
              : "—"}
          </div>

          <p id="costNote">
            {data ? data.estimated_cost.note : ""}
          </p>
        </div>

        {/* DOCUMENTS */}

        <div className="card">
          <div className="card-icon">📄</div>

          <h2>Document Checklist</h2>

          <ul className="checklist" id="documents">
            {data ? fillList(data.required_documents) : null}
          </ul>
        </div>

        {/* NEXT STEPS */}

        <div className="card">
          <div className="card-icon">🚀</div>

          <h2>Next Steps</h2>

          <ul className="steps" id="nextSteps">
            {data ? fillList(data.next_steps) : null}
          </ul>
        </div>

        {/* RISKS */}

        <div className="card">
          <div className="card-icon">⚠️</div>

          <h2>Potential Risks / Gaps</h2>

          <ul className="risks" id="risks">
            {data ? fillList(data.risks_or_gaps) : null}
          </ul>
        </div>

        {/* DIFFICULTY */}

        <div className="card">
          <div className="card-icon">📊</div>

          <h2>Difficulty Level</h2>

          <div className="badge" id="difficulty">
            {data ? data.difficulty_level : "—"}
          </div>

          <p>
            This estimates how competitive or challenging your pathway may be
            based on your current profile.
          </p>
        </div>
      </div>

      {/* SUMMARY */}

      <div className="summary">
        <h2>🧠 AI Relocation Summary</h2>

        <p id="summary">
          {data ? data.tailored_summary : "—"}
        </p>
      </div>
    </div>
  );
}