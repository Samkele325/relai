# backend/main.py

import json
import os
import re
import time
from typing import Any, Dict

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel, Field

try:
    from google import genai
except ImportError as exc:
    genai = None
    _GEMINI_IMPORT_ERROR = exc
else:
    _GEMINI_IMPORT_ERROR = None

# Load environment variables
load_dotenv()

app = FastAPI(title="RelAI - Relocation AI Analysis API")

# CORS (tighten in production later)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-5.5")

# Gemini model for free analysis
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")


# ---------------------------
# Root Health / Test Routes
# ---------------------------
@app.get("/")
def home():
    return {"message": "RelAI backend running 🚀"}


@app.get("/health")
def health():
    return {"status": "ok"}


# ---------------------------
# Request Model
# ---------------------------
class QuestionnairePayload(BaseModel):
    answers: Dict[str, Any] = Field(default_factory=dict)


# ---------------------------
# AI Output Schema
# ---------------------------
ANALYSIS_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "best_country_match": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "country": {"type": "string"},
                "score": {"type": "integer", "minimum": 0, "maximum": 100},
                "why_it_fits": {
                    "type": "array",
                    "items": {"type": "string"},
                    "minItems": 2,
                },
            },
            "required": ["country", "score", "why_it_fits"],
        },
        "recommended_visa_pathway": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "name": {"type": "string"},
                "why_this_pathway": {
                    "type": "array",
                    "items": {"type": "string"},
                    "minItems": 2,
                },
            },
            "required": ["name", "why_this_pathway"],
        },
        "difficulty_level": {
            "type": "string",
            "enum": ["Easy", "Moderate", "Competitive", "Very Competitive"],
        },
        "estimated_cost": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "currency": {"type": "string"},
                "min": {"type": "integer"},
                "max": {"type": "integer"},
                "note": {"type": "string"},
            },
            "required": ["currency", "min", "max", "note"],
        },
        "required_documents": {
            "type": "array",
            "items": {"type": "string"},
            "minItems": 4,
        },
        "next_steps": {
            "type": "array",
            "items": {"type": "string"},
            "minItems": 4,
        },
        "risks_or_gaps": {
            "type": "array",
            "items": {"type": "string"},
            "minItems": 2,
        },
        "tailored_summary": {"type": "string"},
        "confidence": {
            "type": "integer",
            "minimum": 0,
            "maximum": 100,
        },
    },
    "required": [
        "best_country_match",
        "recommended_visa_pathway",
        "difficulty_level",
        "estimated_cost",
        "required_documents",
        "next_steps",
        "risks_or_gaps",
        "tailored_summary",
        "confidence",
    ],
}


# ---------------------------
# Prompt Builder
# ---------------------------
def build_analysis_prompt(answers: Dict[str, Any]) -> str:
    return f"""
You are an expert relocation strategist for applicants.

Your job:
- Analyze the user's questionnaire answers.
- Return a personalized relocation recommendation.
- Be specific, practical, and structured.
- Do not write generic filler.
- Prefer a confident recommendation rather than multiple vague options.
- If the profile is weak, still give the best realistic pathway and explain gaps.

Output rules:
- Return ONLY valid JSON.
- Do not wrap the JSON in markdown.
- Do not use ```json blocks.
- Do not include explanations outside the JSON.
- Follow this structure exactly:

{{
  "best_country_match": {{
    "country": "",
    "score": 0,
    "why_it_fits": []
  }},
  "recommended_visa_pathway": {{
    "name": "",
    "why_this_pathway": []
  }},
  "difficulty_level": "",
  "estimated_cost": {{
    "currency": "",
    "min": 0,
    "max": 0,
    "note": ""
  }},
  "required_documents": [],
  "next_steps": [],
  "risks_or_gaps": [],
  "tailored_summary": "",
  "confidence": 0
}}

User answers:
{json.dumps(answers, ensure_ascii=False, indent=2)}
""".strip()


# ---------------------------
# Gemini Helpers
# ---------------------------
def get_gemini_client():
    if genai is None:
        raise HTTPException(
            status_code=500,
            detail=f"Gemini SDK is not installed: {_GEMINI_IMPORT_ERROR}",
        )

    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY is not set",
        )

    return genai.Client(api_key=api_key)


def clean_model_text(text: str) -> str:
    cleaned = text.strip()

    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*```$", "", cleaned)

    return cleaned.strip()


def validate_analysis_payload(data: Dict[str, Any]) -> Dict[str, Any]:
    required_keys = [
        "best_country_match",
        "recommended_visa_pathway",
        "difficulty_level",
        "estimated_cost",
        "required_documents",
        "next_steps",
        "risks_or_gaps",
        "tailored_summary",
        "confidence",
    ]

    missing = [key for key in required_keys if key not in data]
    if missing:
        raise ValueError(f"Missing required fields: {', '.join(missing)}")

    return data


# ---------------------------
# API Endpoint
# ---------------------------
@app.post("/api/analyze")
def analyze(payload: QuestionnairePayload):
    try:
        prompt = build_analysis_prompt(payload.answers)
        gemini_client = get_gemini_client()

        response = None

        for attempt in range(3):
            try:
                response = gemini_client.models.generate_content(
                    model=GEMINI_MODEL,
                    contents=prompt
                )
                break

            except Exception as e:
                if "503" in str(e):
                    time.sleep(5)
                    continue
                raise

        if response is None:
            raise Exception("Gemini unavailable after 3 attempts")

        raw_text = getattr(response, "text", None) or ""
        raw_text = clean_model_text(raw_text)

        print("\n===== GEMINI RESPONSE =====")
        print(raw_text)
        print("===========================\n")

        if not raw_text:
            raise ValueError("Empty Gemini output")

        data = json.loads(raw_text)
        data = validate_analysis_payload(data)

        return {
            "success": True,
            "analysis": data,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI analysis failed: {str(e)}",
        )