"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Script from "next/script";
import "./questionnaire.css";

type QuestionnaireData = {
  name: string;
  email: string;
  age: string;
  citizenship: string;
  country: string;
  education: string;
  profession: string;
  experience: string;
  funds: string;
  goal: string;
  destination_interest: string[];
};

type AnalysisResponse = {
  success?: boolean;
  analysis?: unknown;
  detail?: string;
};

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: any) => { render: (selector: string) => void };
    };
  }
}

const PRICING_MAP: Record<
  string,
  {
    free: string;
    premium: string;
    funds: string[];
  }
> = {
  "South Africa": {
    free: "R250 ZAR (~$15 USD)",
    premium: "R250 ZAR (~$15 USD)",
    funds: ["Under R50k", "R50k–R100k", "R100k–R300k", "R300k+"],
  },
  Brazil: {
    free: "R$75 BRL (~$15 USD)",
    premium: "R$75 BRL (~$15 USD)",
    funds: ["Under R$10k", "R$10k–R$50k", "R$50k–R$150k", "R$150k+"],
  },
  India: {
    free: "₹1,441 INR (~$15 USD)",
    premium: "₹1,441 INR (~$15 USD)",
    funds: ["Under ₹100k", "₹100k–₹500k", "₹500k–₹1M", "₹1M+"],
  },
  Nigeria: {
    free: "₦20,563 NGN (~$15 USD)",
    premium: "₦20,563 NGN (~$15 USD)",
    funds: ["Under ₦5M", "₦5M–₦15M", "₦15M–₦50M", "₦50M+"],
  },
  "United States": {
    free: "$15 USD",
    premium: "$15 USD",
    funds: ["Under $5k", "$5k–$10k", "$10k–$30k", "$30k+"],
  },
};

const initialQuestionnaire: QuestionnaireData = {
  name: "",
  email: "",
  age: "",
  citizenship: "",
  country: "",
  education: "",
  profession: "",
  experience: "",
  funds: "",
  goal: "",
  destination_interest: [],
};

function formatAnalysisText(data: unknown): string {
  if (!data) return "No analysis returned.";

  if (typeof data === "string") return data;

  if (typeof data !== "object") return String(data);

  const analysis = data as any;

  const lines: string[] = [];

  if (analysis.best_country_match) {
    lines.push(
      `Best Country Match: ${analysis.best_country_match.country} (${analysis.best_country_match.score}/100)`
    );
    if (Array.isArray(analysis.best_country_match.why_it_fits)) {
      lines.push("");
      lines.push("Why it fits:");
      analysis.best_country_match.why_it_fits.forEach((item: string) => {
        lines.push(`• ${item}`);
      });
    }
  }

  if (analysis.recommended_visa_pathway) {
    lines.push("");
    lines.push(`Recommended Visa Pathway: ${analysis.recommended_visa_pathway.name}`);
    if (Array.isArray(analysis.recommended_visa_pathway.why_this_pathway)) {
      lines.push("");
      lines.push("Why this pathway:");
      analysis.recommended_visa_pathway.why_this_pathway.forEach((item: string) => {
        lines.push(`• ${item}`);
      });
    }
  }

  if (analysis.difficulty_level) {
    lines.push("");
    lines.push(`Difficulty Level: ${analysis.difficulty_level}`);
  }

  if (analysis.estimated_cost) {
    lines.push("");
    lines.push(
      `Estimated Cost: ${analysis.estimated_cost.currency} ${analysis.estimated_cost.min} - ${analysis.estimated_cost.max}`
    );
    if (analysis.estimated_cost.note) {
      lines.push(`${analysis.estimated_cost.note}`);
    }
  }

  if (Array.isArray(analysis.required_documents)) {
    lines.push("");
    lines.push("Required Documents:");
    analysis.required_documents.forEach((item: string) => {
      lines.push(`• ${item}`);
    });
  }

  if (Array.isArray(analysis.next_steps)) {
    lines.push("");
    lines.push("Next Steps:");
    analysis.next_steps.forEach((item: string) => {
      lines.push(`• ${item}`);
    });
  }

  if (Array.isArray(analysis.risks_or_gaps)) {
    lines.push("");
    lines.push("Risks or Gaps:");
    analysis.risks_or_gaps.forEach((item: string) => {
      lines.push(`• ${item}`);
    });
  }

  if (analysis.tailored_summary) {
    lines.push("");
    lines.push("Tailored Summary:");
    lines.push(analysis.tailored_summary);
  }

  if (typeof analysis.confidence === "number") {
    lines.push("");
    lines.push(`Confidence: ${analysis.confidence}%`);
  }

  return lines.join("\n");
}

export default function QuestionnairePage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<QuestionnaireData>(initialQuestionnaire);
  const [loadingStateVisible, setLoadingStateVisible] = useState(false);
  const [analysisCardVisible, setAnalysisCardVisible] = useState(false);
  const [showPremiumButton, setShowPremiumButton] = useState(false);
  const [analysisText, setAnalysisText] = useState("This appears on the same page after the analysis is generated.");
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const [paypalReadyText, setPaypalReadyText] = useState(
    "PayPal checkout will appear here after you continue to secure payment."
  );

  const paypalRenderedRef = useRef(false);
  const paypalContainerRef = useRef<HTMLDivElement | null>(null);
  const stepRefs = useRef<Array<HTMLElement | null>>([]);
  const progressPercent = Math.min(((currentStep + 1) / 6) * 100, 100);

  const selectedCountryConfig = useMemo(() => {
    return PRICING_MAP[formData.country] || PRICING_MAP["United States"];
  }, [formData.country]);

  useEffect(() => {
    const savedEmail =
      localStorage.getItem("relai_email") ||
      sessionStorage.getItem("relai_email") ||
      "";

    const savedQuestionnaire =
      localStorage.getItem("relai_questionnaire_data") ||
      sessionStorage.getItem("relai_questionnaire_data") ||
      "";

    if (savedQuestionnaire) {
      try {
        const parsed = JSON.parse(savedQuestionnaire) as Partial<QuestionnaireData>;
        setFormData((prev) => ({
          ...prev,
          ...parsed,
          destination_interest: Array.isArray(parsed.destination_interest)
            ? parsed.destination_interest
            : prev.destination_interest,
        }));
      } catch {
        // Ignore invalid stored data.
      }
    } else if (savedEmail) {
      setFormData((prev) => ({
        ...prev,
        email: prev.email || savedEmail,
      }));
    }
  }, []);

  useEffect(() => {
    const el = stepRefs.current[currentStep];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [currentStep]);

  useEffect(() => {
    if (formData.email) {
      localStorage.setItem("relai_email", formData.email);
      sessionStorage.setItem("relai_email", formData.email);
    }
  }, [formData.email]);

  useEffect(() => {
    localStorage.setItem("relai_questionnaire_data", JSON.stringify(formData));
    sessionStorage.setItem("relai_questionnaire_data", JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    const storedAnalysis =
      localStorage.getItem("relai_free_analysis") ||
      sessionStorage.getItem("relai_free_analysis");

    if (storedAnalysis) {
      try {
        const parsed = JSON.parse(storedAnalysis);
        setAnalysisText(formatAnalysisText(parsed));
        setShowPremiumButton(true);
      } catch {
        setAnalysisText(storedAnalysis);
        setShowPremiumButton(true);
      }
    }

    const premiumUnlocked =
      localStorage.getItem("relai_premium_unlocked") ||
      sessionStorage.getItem("relai_premium_unlocked");

    if (premiumUnlocked === "true") {
      setShowPremiumButton(true);
    }
  }, []);

  const goNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 6));
  };

  const updateField = <K extends keyof QuestionnaireData>(key: K, value: QuestionnaireData[K]) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const toggleDestination = (country: string) => {
    setFormData((prev) => {
      const exists = prev.destination_interest.includes(country);
      return {
        ...prev,
        destination_interest: exists
          ? prev.destination_interest.filter((item) => item !== country)
          : [...prev.destination_interest, country],
      };
    });
  };

  const getQuestionnaireData = (): QuestionnaireData => {
    return {
      ...formData,
      country: formData.country || "United States",
      destination_interest: [...formData.destination_interest],
    };
  };

  const saveQuestionnaireSnapshot = (data: QuestionnaireData) => {
    localStorage.setItem("relai_questionnaire", JSON.stringify(data));
    sessionStorage.setItem("relai_questionnaire", JSON.stringify(data));

    localStorage.setItem("relai_questionnaire_data", JSON.stringify(data));
    sessionStorage.setItem("relai_questionnaire_data", JSON.stringify(data));

    localStorage.setItem("relai_email", data.email || "");
    sessionStorage.setItem("relai_email", data.email || "");

    localStorage.setItem("relai_origin_country", data.country || "");
    sessionStorage.setItem("relai_origin_country", data.country || "");

    localStorage.setItem("relai_profession", data.profession || "");
    sessionStorage.setItem("relai_profession", data.profession || "");
  };

const handleViewAnalysis = async () => {
  setLoadingStateVisible(true);
  setAnalysisCardVisible(false);

  const questionnaireData = getQuestionnaireData();

  saveQuestionnaireSnapshot(questionnaireData);

  try {
    const response = await fetch(
      "https://relai-production-99f8.up.railway.app/api/analyze",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answers: questionnaireData,
        }),
      }
    );

    const data = (await response.json()) as AnalysisResponse;

    console.log("Response status:", response.status);
    console.log("Response data:", data);

    if (!response.ok) {
      throw new Error(data?.detail || "Failed to generate analysis");
    }

    const analysis = data.analysis ?? data;

    const formatted = formatAnalysisText(analysis);

    localStorage.setItem(
      "relai_free_analysis",
      JSON.stringify(analysis)
    );

    sessionStorage.setItem(
      "relai_free_analysis",
      JSON.stringify(analysis)
    );

    setAnalysisText(formatted);
    setAnalysisCardVisible(true);
    setShowPremiumButton(true);
  } catch (error) {
    console.error(error);

    alert(
      "Failed to generate AI analysis. Please try again."
    );
  } finally {
    setLoadingStateVisible(false);
  }
};

  const openPremiumModal = () => {
    saveQuestionnaireSnapshot(getQuestionnaireData());
    setPremiumModalOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closePremiumModal = () => {
    setPremiumModalOpen(false);
    document.body.style.overflow = "";
  };

  const buildPaymentIntentData = () => {
    const questionnaireData = getQuestionnaireData();
    const email = formData.email.trim() || questionnaireData.email.trim();

    return {
      email,
      questionnaire: questionnaireData,
      selectedCountry: questionnaireData.country,
      profession: questionnaireData.profession,
      paymentIntent: true,
      paymentStatus: "pending",
      premiumUnlocked: false,
      createdAt: new Date().toISOString(),
    };
  };

  const initPayPalCheckout = () => {
    const questionnaireData = getQuestionnaireData();
    const email = formData.email.trim() || questionnaireData.email.trim();

    if (!email) {
      alert("Please confirm your email.");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      email,
    }));

    const paymentIntentData = buildPaymentIntentData();

    localStorage.setItem("relai_payment_intent", JSON.stringify(paymentIntentData));
    sessionStorage.setItem("relai_payment_intent", JSON.stringify(paymentIntentData));
    localStorage.setItem("relai_payment_status", "pending");
    sessionStorage.setItem("relai_payment_status", "pending");

    setPaypalReadyText("Preparing secure PayPal checkout...");

    if (window.paypal && typeof window.paypal.Buttons === "function") {
      if (paypalRenderedRef.current) return;

      paypalRenderedRef.current = true;
      setPaypalReadyText("");

      if (!paypalContainerRef.current) return;

      window.paypal
        .Buttons({
          style: {
            layout: "vertical",
            shape: "pill",
            color: "gold",
            label: "paypal",
          },

          createOrder: function (_data: any, actions: any) {
            const selectedCountry = formData.country || "United States";
            let amount = "15";

            if (selectedCountry === "South Africa") amount = "14";
            if (selectedCountry === "Brazil") amount = "15";
            if (selectedCountry === "India") amount = "16";
            if (selectedCountry === "Nigeria") amount = "13";

            return actions.order.create({
              purchase_units: [
                {
                  amount: {
                    value: amount,
                  },
                },
              ],
            });
          },

          onApprove: async function (data: any, actions: any) {
            try {
              const details = await actions.order.capture();

              sessionStorage.setItem("relai_premium_unlocked", "true");
              localStorage.setItem("relai_premium_unlocked", "true");

              const questionnaireData = getQuestionnaireData();
              sessionStorage.setItem(
                "relai_questionnaire_data",
                JSON.stringify(questionnaireData)
              );
              localStorage.setItem(
                "relai_questionnaire_data",
                JSON.stringify(questionnaireData)
              );

              localStorage.setItem("relai_payment_status", "paid");
              sessionStorage.setItem("relai_payment_status", "paid");

              localStorage.setItem(
                "relai_payment_receipt",
                JSON.stringify({
                  paypalOrderId: data.orderID,
                  details,
                  paidAt: new Date().toISOString(),
                })
              );

              sessionStorage.setItem(
                "relai_payment_receipt",
                JSON.stringify({
                  paypalOrderId: data.orderID,
                  details,
                  paidAt: new Date().toISOString(),
                })
              );

              window.location.href = "/result";
            } catch (err) {
              console.error(err);
              alert("Payment approval failed. Please try again.");
            }
          },

          onError: function (err: unknown) {
            console.error(err);
            alert("Payment failed. Please try again.");
          },
        })
        .render("#paypal-button-container");
    } else {
      setPaypalReadyText(
        "PayPal is not ready yet. Please check your client ID and reload the page."
      );
    }
  };

  return (
    <>
      <Script
        src="https://www.paypal.com/sdk/js?client-id=AYLeuCy_I_Kll_oOMGZl0Aza8fa7mIta9-sSIq9-p_RHPlXEclyBsIKtvney6okR39OfPuyXzAypegFv&currency=USD"
        strategy="afterInteractive"
      />

      <div className="bg-glow" />
      <div className="bg-glow-2" />

      <nav>
        <div className="logo">RelAI</div>

        <a href="landing.html" className="back-btn">
          ← Back
        </a>
      </nav>

      <div className="container">
        <div className="header">
          <div className="badge">AI-Powered Relocation Assessment</div>

          <h1>Find Your Best Visa Pathway</h1>

          <p>
            Complete this quick assessment and our AI will analyze your relocation
            opportunities based on your profile, finances, experience, and goals.
          </p>
        </div>

        <div className="progress-wrapper">
          <div className="progress-card">
            <div className="progress-top">
              <span>Assessment Progress</span>
              <span id="progressText">{Math.round(progressPercent)}%</span>
            </div>

            <div className="progress-bar">
              <div
                className="progress-fill"
                id="progressFill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        <section
          className={`form-step ${currentStep >= 0 ? "active" : ""}`}
          ref={(el) => {
            stepRefs.current[0] = el;
          }}
        >
          <div className="card">
            <span className="step-label">SECTION 1</span>

            <h2>Basic Information</h2>

            <p>Tell us a little about yourself so we can personalize your relocation analysis.</p>

            <div className="input-group">
              <label>Full Name</label>
              <input
                type="text"
                id="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>Email Address</label>
              <input
                type="email"
                id="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>Age</label>
              <input
                type="number"
                id="age"
                placeholder="Enter your age"
                value={formData.age}
                onChange={(e) => updateField("age", e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>Citizenship</label>
              <input
                type="text"
                id="citizenship"
                placeholder="e.g South African"
                value={formData.citizenship}
                onChange={(e) => updateField("citizenship", e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>Current Country</label>
              <select
                id="country"
                value={formData.country}
                onChange={(e) => updateField("country", e.target.value)}
              >
                <option value="">Select Country</option>
                <option value="South Africa">South Africa</option>
                <option value="Brazil">Brazil</option>
                <option value="India">India</option>
                <option value="Nigeria">Nigeria</option>
                <option value="United States">United States</option>
              </select>
            </div>

            <div className="btn-row">
              <button type="button" className="next-btn" onClick={goNext}>
                Continue →
              </button>
            </div>
          </div>
        </section>

        <section
          className={`form-step ${currentStep >= 1 ? "active" : ""}`}
          ref={(el) => {
            stepRefs.current[1] = el;
          }}
        >
          <div className="card">
            <span className="step-label">SECTION 2</span>

            <h2>Education</h2>

            <p>Your education level helps us identify eligible visa pathways.</p>

            <div className="input-group">
              <label>Highest Education Level</label>

              <select
                id="education"
                value={formData.education}
                onChange={(e) => updateField("education", e.target.value)}
              >
                <option value="">Select Education</option>
                <option value="High School">High School</option>
                <option value="Diploma">Diploma</option>
                <option value="Bachelor’s">Bachelor’s</option>
                <option value="Master’s">Master’s</option>
                <option value="PhD">PhD</option>
              </select>
            </div>

            <div className="btn-row">
              <button type="button" className="next-btn" onClick={goNext}>
                Continue →
              </button>
            </div>
          </div>
        </section>

        <section
          className={`form-step ${currentStep >= 2 ? "active" : ""}`}
          ref={(el) => {
            stepRefs.current[2] = el;
          }}
        >
          <div className="card">
            <span className="step-label">SECTION 3</span>

            <h2>Work Experience</h2>

            <p>Your work history plays a major role in relocation eligibility.</p>

            <div className="input-group">
              <label>Current Job Title</label>
              <input
                type="text"
                id="profession"
                placeholder="e.g Software Engineer"
                value={formData.profession}
                onChange={(e) => updateField("profession", e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>Years of Experience</label>
              <input
                type="number"
                id="experience"
                placeholder="e.g 3"
                value={formData.experience}
                onChange={(e) => updateField("experience", e.target.value)}
              />
            </div>

            <div className="btn-row">
              <button type="button" className="next-btn" onClick={goNext}>
                Continue →
              </button>
            </div>
          </div>
        </section>

        <section
          className={`form-step ${currentStep >= 3 ? "active" : ""}`}
          ref={(el) => {
            stepRefs.current[3] = el;
          }}
        >
          <div className="card">
            <span className="step-label">SECTION 4</span>

            <h2>Finances</h2>

            <p>This helps us estimate affordability and relocation readiness.</p>

            <div className="input-group">
              <label id="fundsLabel">
                Available Funds
                <span
                  style={{
                    display: "block",
                    marginTop: 8,
                    color: "#8b6f47",
                    fontSize: "0.95rem",
                    fontWeight: 600,
                  }}
                >
                  Estimated relocation benchmark: {selectedCountryConfig.free}
                </span>
              </label>

              <select
                id="funds"
                value={formData.funds}
                onChange={(e) => updateField("funds", e.target.value)}
              >
                <option value="">Select Range</option>
                {selectedCountryConfig.funds.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="btn-row">
              <button type="button" className="next-btn" onClick={goNext}>
                Continue →
              </button>
            </div>
          </div>
        </section>

        <section
          className={`form-step ${currentStep >= 4 ? "active" : ""}`}
          ref={(el) => {
            stepRefs.current[4] = el;
          }}
        >
          <div className="card">
            <span className="step-label">SECTION 5</span>

            <h2>Your Goals</h2>

            <p>Select the main reason you want to move abroad.</p>

            <div className="option-grid">
              <div className="radio-card">
                <input
                  type="radio"
                  id="study"
                  name="goal"
                  value="Study Abroad"
                  checked={formData.goal === "Study Abroad"}
                  onChange={(e) => updateField("goal", e.target.value)}
                />
                <label htmlFor="study">🎓 Study Abroad</label>
              </div>

              <div className="radio-card">
                <input
                  type="radio"
                  id="work"
                  name="goal"
                  value="Work Abroad"
                  checked={formData.goal === "Work Abroad"}
                  onChange={(e) => updateField("goal", e.target.value)}
                />
                <label htmlFor="work">💼 Work Abroad</label>
              </div>

              <div className="radio-card">
                <input
                  type="radio"
                  id="relocate"
                  name="goal"
                  value="Permanent Relocation"
                  checked={formData.goal === "Permanent Relocation"}
                  onChange={(e) => updateField("goal", e.target.value)}
                />
                <label htmlFor="relocate">🌍 Permanent Relocation</label>
              </div>
            </div>

            <div className="btn-row">
              <button type="button" className="next-btn" onClick={goNext}>
                Continue →
              </button>
            </div>
          </div>
        </section>

        <section
          className={`form-step ${currentStep >= 5 ? "active" : ""}`}
          ref={(el) => {
            stepRefs.current[5] = el;
          }}
        >
          <div className="card">
            <span className="step-label">SECTION 6</span>

            <h2>Target Countries</h2>

            <p>Choose the countries you are most interested in.</p>

            <div className="option-grid">
              <div className="check-card">
                <input
                  type="checkbox"
                  id="canada"
                  checked={formData.destination_interest.includes("Canada")}
                  onChange={() => toggleDestination("Canada")}
                />
                <label htmlFor="canada">🇨🇦 Canada</label>
              </div>

              <div className="check-card">
                <input
                  type="checkbox"
                  id="uk"
                  checked={formData.destination_interest.includes("United Kingdom")}
                  onChange={() => toggleDestination("United Kingdom")}
                />
                <label htmlFor="uk">🇬🇧 United Kingdom</label>
              </div>

              <div className="check-card">
                <input
                  type="checkbox"
                  id="usa"
                  checked={formData.destination_interest.includes("United States")}
                  onChange={() => toggleDestination("United States")}
                />
                <label htmlFor="usa">🇺🇸 United States</label>
              </div>
            </div>

            <div className="btn-row">
              <button type="button" className="next-btn" id="finishBtn" onClick={goNext}>
                Finish Assessment →
              </button>
            </div>
          </div>
        </section>

        <section
          className={`form-step ${currentStep >= 6 ? "active" : ""}`}
          ref={(el) => {
            stepRefs.current[6] = el;
          }}
        >
          <div className="card success-card">
            <span className="step-label">COMPLETE</span>

            <h2>Assessment Submitted Successfully</h2>

            <p>
              Your AI relocation analysis is now being prepared. We&apos;ll generate
              the best migration pathways, country matches, and recommendations for
              your profile.
            </p>

            <button type="button" id="viewAnalysisBtn" className="next-btn" onClick={handleViewAnalysis}>
              View AI Analysis
            </button>

            <div
              id="loadingState"
              className="loading-state"
              style={{ display: loadingStateVisible ? "block" : "none" }}
            >
              <div className="spinner" />

              <h3>Generating Your AI Relocation Roadmap...</h3>

              <p>
                RelAI is analyzing your profile, profession, finances, and
                destination opportunities.
              </p>
            </div>

            <div
              id="analysisCard"
              className={`analysis-card ${analysisCardVisible ? "active" : ""}`}
              aria-live="polite"
              style={{ display: analysisCardVisible ? "block" : "none" }}
            >
              <h3>Your Free AI Analysis</h3>
              <p>This appears on the same page after the analysis is generated.</p>
              <div id="analysisContent" className="analysis-content">
                <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{analysisText}</pre>
              </div>
            </div>

            {showPremiumButton ? (
              <button type="button" id="premiumBtn" className="premium-btn" onClick={openPremiumModal}>
                ✨ Get Full AI Report
              </button>
            ) : null}
          </div>
        </section>
      </div>

      <div
        className={`modal-overlay ${premiumModalOpen ? "active" : ""}`}
        id="premiumModal"
        onClick={(e) => {
          if (e.target === e.currentTarget) closePremiumModal();
        }}
      >
        <div className="premium-modal">
          <button className="close-modal" id="closeModal" onClick={closePremiumModal} type="button">
            ✕
          </button>

          <h2 className="modal-title">Unlock Your Full AI Relocation Roadmap 🌍</h2>

          <p className="modal-subtitle">
            Get a deeper AI-powered breakdown tailored to your career, finances,
            immigration profile, and relocation goals.
          </p>

          <div className="checklist">
            <div className="check-item">
              <div className="tick">✓</div>
              <span>Detailed eligibility analysis</span>
            </div>

            <div className="check-item">
              <div className="tick">✓</div>
              <span>Best cities for your profession</span>
            </div>

            <div className="check-item">
              <div className="tick">✓</div>
              <span>Salary expectations</span>
            </div>

            <div className="check-item">
              <div className="tick">✓</div>
              <span>Step-by-step relocation roadmap</span>
            </div>

            <div className="check-item">
              <div className="tick">✓</div>
              <span>Visa comparisons</span>
            </div>

            <div className="check-item">
              <div className="tick">✓</div>
              <span>Estimated timelines</span>
            </div>

            <div className="check-item">
              <div className="tick">✓</div>
              <span>Required documents checklist</span>
            </div>

            <div className="check-item">
              <div className="tick">✓</div>
              <span>AI-powered relocation strategy</span>
            </div>
          </div>

          <div className="price-box">
            <div className="price-label">Full Premium AI Report</div>
            <div className="dynamic-price" id="premiumPrice">
              {selectedCountryConfig.premium}
            </div>
          </div>

          <div className="email-confirm">
            <input
              type="email"
              id="premiumEmail"
              placeholder="Confirm your email address"
              value={formData.email}
              onChange={(e) => updateField("email", e.target.value)}
            />

            <small>Your email is prefilled from the questionnaire and can be edited here.</small>
          </div>

          <button
            className="next-btn"
            id="premiumPayBtn"
            type="button"
            style={{ width: "100%" }}
            onClick={initPayPalCheckout}
          >
            Continue To Secure Payment
          </button>

          <div
            className={`paypal-wrapper ${premiumModalOpen ? "active" : ""}`}
            id="paypal-button-container"
            ref={paypalContainerRef}
            style={{ display: premiumModalOpen ? "block" : "none" }}
          >
            <div className="paypal-placeholder" id="paypalPlaceholder">
              {paypalReadyText || "PayPal checkout will appear here after you continue to secure payment."}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}