"""Explainable student risk scoring (0-100). No ML or API needed."""

FIX = {
    "attendance": "Talk to the student and parents about regular attendance.",
    "marks": "Arrange extra classes or peer tutoring for weak subjects.",
    "trend": "Review the latest exam paper with the student to find gaps.",
    "fees": "Ask the accounts office to discuss a payment plan.",
}

def _clamp(x):
    return max(0.0, min(1.0, x))

def level_of(score):
    return "High" if score >= 60 else "Medium" if score >= 30 else "Low"

def compute_risk(s):
    reasons, factors, score = [], [], 0
    def add(pts, factor, text):
        nonlocal score
        if pts > 0:
            score += pts; factors.append(factor); reasons.append(text)
    add(int(35 * _clamp((90 - s.attendance) / 30) + 0.5), "attendance", f"Attendance is {s.attendance}%")
    add(int(30 * _clamp((70 - s.marks) / 25) + 0.5), "marks", f"Average marks are {s.marks}%")
    scores = [r.score for r in sorted(s.results.all(), key=lambda r: r.id)]
    if len(scores) > 1 and scores[-2] > scores[-1]:
        drop = scores[-2] - scores[-1]
        add(int(20 * _clamp(drop / 20) + 0.5), "trend", f"Score fell {drop} points in the latest exam")
    pending = sum(f.amount for f in s.fees.all() if f.status == "pending")
    add(15 if pending else 0, "fees", f"₹{pending:,} fees pending")
    score = min(100, score)
    return {"id": s.id, "name": s.name, "score": score, "level": level_of(score), "reasons": reasons, "factors": factors}
