def check_eligibility(s):
    """Hall ticket rule: no pending fees and attendance of at least 75%."""
    reasons = []
    pending = sum(f.amount for f in s.fees.all() if f.status == "pending")
    if pending:
        reasons.append(f"₹{pending:,} fees pending")
    if s.attendance < 75:
        reasons.append(f"Attendance is {s.attendance}% (minimum 75%)")
    return {"id": s.id, "name": s.name, "eligible": not reasons, "reasons": reasons}
