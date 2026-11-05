import json
import logging
import os
import urllib.request
from .risk import FIX

log = logging.getLogger(__name__)

def rule_suggestion(r):
    if not r["factors"]:
        return "Student is on track. Keep encouraging."
    return "Suggested actions: " + " ".join(f"{i}) {FIX[f]}" for i, f in enumerate(r["factors"], 1))

def _post(url, payload, headers):
    """POST JSON and return the parsed answer, or None on any failure (the caller falls back to rules)."""
    req = urllib.request.Request(url, data=json.dumps(payload).encode(), method="POST", headers={"content-type": "application/json", **headers})
    try:
        return json.loads(urllib.request.urlopen(req, timeout=20).read())
    except Exception:
        log.warning("AI provider call failed: %s", url.split("?")[0], exc_info=True)
        return None

def _gemini(prompt):
    """Google Gemini through the free AI Studio key. Several models are tried because model names change over time."""
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        return None
    for model in [m.strip() for m in os.getenv("GEMINI_MODEL", "gemini-2.5-flash,gemini-2.5-flash-lite").split(",") if m.strip()]:
        data = _post(f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
                     {"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"maxOutputTokens": 300, "temperature": 0.4}},
                     {"x-goog-api-key": key})
        try:
            text = "".join(p.get("text", "") for p in data["candidates"][0]["content"]["parts"]).strip()
        except (TypeError, KeyError, IndexError):
            text = ""
        if text:
            return text, "gemini"
    return None

def _openai_compatible(prompt):
    """Any provider that speaks the OpenAI chat format (Groq, OpenRouter, Mistral, a local Ollama ...). Set AI_BASE_URL, AI_API_KEY, AI_MODEL."""
    base, key, model = os.getenv("AI_BASE_URL"), os.getenv("AI_API_KEY"), os.getenv("AI_MODEL")
    if not (base and key and model):
        return None
    data = _post(base.rstrip("/") + "/chat/completions", {"model": model, "max_tokens": 300, "temperature": 0.4,
                 "messages": [{"role": "user", "content": prompt}]}, {"authorization": "Bearer " + key})
    try:
        text = data["choices"][0]["message"]["content"].strip()
    except (TypeError, KeyError, IndexError, AttributeError):
        text = ""
    return (text, os.getenv("AI_NAME", "ai")) if text else None

def ai_suggestion(r):
    """Ask a free AI provider for teacher actions. Returns (text, provider) or None, in which case the rule-based text is used.
    Only anonymous numbers are sent: no name, email or roll number."""
    prompt = (f"You assist a school counsellor. A student has a risk score of {r['score']}/100 ({r['level']}). "
              f"Factors: {'; '.join(r['reasons']) or 'none'}. Give 3 short, practical, supportive actions the teacher can take "
              "this week. Plain text, max 80 words, no student names.")
    for provider in (_gemini, _openai_compatible):
        result = provider(prompt)
        if result:
            return result
    return None
