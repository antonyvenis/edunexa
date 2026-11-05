from io import BytesIO
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import Image, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

LOGO = Path(__file__).parent / "assets" / "logo.png"

def _header(st):
    """EduNexa logo with the product name, used at the top of every PDF."""
    brand = ParagraphStyle("brand", parent=st["Title"], alignment=TA_LEFT, fontSize=26, leading=30)
    sub = ParagraphStyle("brandsub", parent=st["Normal"], textColor=colors.grey)
    text = [Paragraph("EduNexa", brand), Paragraph("Smart School &amp; College Management System", sub)]
    header = Table([[Image(str(LOGO), width=48, height=48), text]] if LOGO.exists() else [[text]], colWidths=[58, 440] if LOGO.exists() else None)
    header.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("LEFTPADDING", (0, 0), (-1, -1), 0)]))
    return [header]

def grade(p):
    return "A+" if p >= 90 else "A" if p >= 80 else "B" if p >= 70 else "C" if p >= 60 else "D" if p >= 50 else "F"

def build_report_card(s):
    buf, st, ink = BytesIO(), getSampleStyleSheet(), colors.HexColor("#1e1b4b")
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=40, bottomMargin=40)
    info = Table([["Name", s.name, "Roll no", s.roll_no],
                  ["Course", s.course.name if s.course else "-", "Year", str(s.year)],
                  ["Email", s.email, "Attendance", f"{s.attendance}%"]], colWidths=[60, 190, 70, 150])
    info.setStyle(TableStyle([("FONTSIZE", (0, 0), (-1, -1), 10), ("TEXTCOLOR", (0, 0), (0, -1), colors.grey),
                              ("TEXTCOLOR", (2, 0), (2, -1), colors.grey)]))
    results = list(s.results.all())
    rows = [["Exam", "Subject", "Score", "Grade"]] + [[r.exam, r.subject, f"{r.score}%", grade(r.score)] for r in results]
    table = Table(rows, colWidths=[110, 200, 80, 80], repeatRows=1)
    table.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), ink), ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                               ("GRID", (0, 0), (-1, -1), .4, colors.lightgrey),
                               ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f6f5fb")])]))
    avg = round(sum(r.score for r in results) / len(results)) if results else s.marks
    pending = sum(f.amount for f in s.fees.all() if f.status == "pending")
    doc.build([*_header(st),
               Spacer(1, 18), Paragraph("Progress Report Card", st["Heading2"]), info, Spacer(1, 16),
               Paragraph("Exam results", st["Heading3"]), table, Spacer(1, 16),
               Paragraph(f"Overall: <b>{avg}%</b> &nbsp;&nbsp; Grade: <b>{grade(avg)}</b>", st["Heading3"]),
               Paragraph(f"Fees pending: Rs. {pending:,}", st["Normal"])])
    return buf.getvalue()

def build_receipt(f):
    buf, st = BytesIO(), getSampleStyleSheet()
    s = f.student
    rows = [["Receipt no", f"EDU-{f.id:05d}"], ["Student", s.name], ["Roll no", s.roll_no],
            ["Course", s.course.name if s.course else "-"], ["Due date", str(f.due_date)],
            ["Amount paid", f"Rs. {f.amount:,}"], ["Status", "PAID"]]
    t = Table(rows, colWidths=[140, 300])
    t.setStyle(TableStyle([("GRID", (0, 0), (-1, -1), .4, colors.lightgrey), ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f6f5fb")),
                           ("FONTSIZE", (0, 0), (-1, -1), 11), ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                           ("TEXTCOLOR", (1, 6), (1, 6), colors.HexColor("#047857"))]))
    SimpleDocTemplate(buf, pagesize=A4, topMargin=50).build([
        *_header(st),
        Spacer(1, 20), Paragraph("Fee Receipt", st["Heading2"]), t, Spacer(1, 24),
        Paragraph("This is a computer-generated receipt and needs no signature.", st["Italic"])])
    return buf.getvalue()


def build_hall_ticket(s, exams):
    buf, st, ink = BytesIO(), getSampleStyleSheet(), colors.HexColor("#1e1b4b")
    info = Table([["Name", s.name, "Roll no", s.roll_no], ["Course", s.course.name if s.course else "-", "Year", str(s.year)]], colWidths=[60, 190, 70, 150])
    info.setStyle(TableStyle([("FONTSIZE", (0, 0), (-1, -1), 10), ("TEXTCOLOR", (0, 0), (0, -1), colors.grey), ("TEXTCOLOR", (2, 0), (2, -1), colors.grey)]))
    rows = [["Date", "Time", "Subject", "Hall"]] + [[str(e.date), f"{e.start:%H:%M} - {e.end:%H:%M}", e.subject, e.hall] for e in exams]
    table = Table(rows, colWidths=[90, 110, 190, 80], repeatRows=1)
    table.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), ink), ("TEXTCOLOR", (0, 0), (-1, 0), colors.white), ("GRID", (0, 0), (-1, -1), .4, colors.lightgrey)]))
    notes = ["Carry this hall ticket and your college ID card.", "Reach the hall 20 minutes before the exam starts.", "Mobile phones are not allowed inside the hall."]
    SimpleDocTemplate(buf, pagesize=A4, topMargin=40).build([
        *_header(st), Spacer(1, 16),
        Paragraph("Examination Hall Ticket", st["Heading2"]), info, Spacer(1, 14), table, Spacer(1, 14),
        Paragraph("Instructions", st["Heading3"])] + [Paragraph("• " + n, st["Normal"]) for n in notes])
    return buf.getvalue()
