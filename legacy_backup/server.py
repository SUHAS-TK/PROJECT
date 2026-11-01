"""
server.py – Static Web Server with Real Gmail SMTP Email Dispatch
Serves static files on port 8000 and provides POST /api/send-email
"""
import os
import re
import json
import smtplib
from http.server import SimpleHTTPRequestHandler, HTTPServer
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from dotenv import load_dotenv

# Load .env
load_dotenv()

PORT = 8000
SMTP_SERVER = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "hulk44678@gmail.com")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "tqkh pxer txja aice")
SMTP_FROM_EMAIL = os.environ.get("SMTP_FROM_EMAIL", SMTP_USER)

print(f"[*] SMTP Configuration loaded: {SMTP_USER} on {SMTP_SERVER}:{SMTP_PORT}")


def build_email_html(project_title, score, grade, summary, questions):
    """Generate beautiful HTML email template."""
    questions_html = ""
    for q in questions:
        q_num = q.get("questionNumber", 1)
        topic = q.get("topic", "General")
        q_score = q.get("score", 80)
        q_text = q.get("questionText", "").replace("\n", "<br/>")
        user_ans = q.get("userAnswer", "")
        model_ans = q.get("modelAnswer", "")

        score_color = "#10b981" if q_score >= 80 else "#f59e0b" if q_score >= 50 else "#ef4444"

        questions_html += f"""
        <div style="background:#f8fafc;border-left:4px solid {score_color};padding:14px 16px;margin-bottom:14px;border-radius:4px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                <span style="font-weight:700;color:#0f172a;">Q{q_num}: {topic}</span>
                <span style="font-weight:700;color:{score_color};">{q_score}/100</span>
            </div>
            <p style="margin:4px 0 8px;color:#334155;font-size:14px;line-height:1.5;"><strong>Question:</strong> {q_text}</p>
            <p style="margin:4px 0 6px;color:#475569;font-size:13px;line-height:1.5;"><strong>Candidate Answer:</strong> {user_ans}</p>
            <p style="margin:4px 0 0;color:#0284c7;font-size:13px;line-height:1.5;"><strong>Model Answer:</strong> {model_ans}</p>
        </div>
        """

    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Viva Voce Performance Report</title>
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background-color:#0f172a;margin:0;padding:24px;color:#334155;">
    <div style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.15);">
        <!-- Header -->
        <div style="background:linear-gradient(135deg, #0f172a 0%, #1e293b 100%);padding:28px;text-align:center;border-bottom:3px solid #00e5ff;">
            <div style="font-size:28px;margin-bottom:6px;">⚡ 🎓</div>
            <h1 style="color:#ffffff;margin:0;font-size:22px;letter-spacing:0.5px;">AI Viva Voce Performance Report</h1>
            <p style="color:#94a3b8;margin:6px 0 0;font-size:14px;">Arc Reactor AI Examination System</p>
        </div>

        <!-- Hero Score Banner -->
        <div style="padding:24px 28px;background:#f0fdf4;border-bottom:1px solid #e2e8f0;text-align:center;">
            <div style="font-size:14px;color:#64748b;text-transform:uppercase;font-weight:700;letter-spacing:1px;margin-bottom:6px;">Project: {project_title}</div>
            <div style="font-size:48px;font-weight:800;color:#059669;line-height:1;">{score}<span style="font-size:24px;color:#64748b;"> / 100</span></div>
            <div style="display:inline-block;margin-top:10px;background:#059669;color:#ffffff;font-size:14px;font-weight:700;padding:4px 16px;border-radius:20px;">Grade: {grade}</div>
        </div>

        <!-- Executive Summary -->
        <div style="padding:24px 28px;border-bottom:1px solid #e2e8f0;">
            <h2 style="font-size:16px;color:#0f172a;margin-top:0;margin-bottom:10px;">📋 Executive Summary</h2>
            <p style="color:#475569;font-size:14px;line-height:1.7;margin:0;">{summary}</p>
        </div>

        <!-- Question Review -->
        <div style="padding:24px 28px;border-bottom:1px solid #e2e8f0;">
            <h2 style="font-size:16px;color:#0f172a;margin-top:0;margin-bottom:14px;">📝 Question-by-Question Evaluation</h2>
            {questions_html}
        </div>

        <!-- Footer -->
        <div style="padding:20px 28px;background:#f8fafc;text-align:center;color:#64748b;font-size:12px;line-height:1.5;">
            Verified by <strong>AI Viva Voce Examination Simulator</strong>.<br/>
            Delivered via Gmail SMTP relay ({SMTP_FROM_EMAIL}).
        </div>
    </div>
</body>
</html>"""


class VivaStaticWithEmailHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        if self.path == "/api/send-email":
            content_length = int(self.headers.get("Content-Length", 0))
            body_bytes = self.rfile.read(content_length)

            try:
                data = json.loads(body_bytes.decode("utf-8"))
            except Exception as e:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": f"Invalid JSON: {str(e)}"}).encode())
                return

            recipient = data.get("email", "").strip()
            if not recipient or "@" not in recipient:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Valid email address is required."}).encode())
                return

            project_title = data.get("project_title", "Viva Examination Project")
            score = data.get("score", 85)
            grade = data.get("grade", "A")
            summary = data.get("summary", "Viva examination successfully completed.")
            questions = data.get("questions", [])

            # Parse multiple emails if comma separated
            recipients = [e.strip() for e in re.split(r"[,;]+", recipient) if e.strip()]

            print(f"[*] Preparing real email dispatch to: {recipients}")

            html_content = build_email_html(project_title, score, grade, summary, questions)
            plain_text = (
                f"AI VIVA VOCE PERFORMANCE REPORT\n\n"
                f"Project: {project_title}\n"
                f"Overall Score: {score}/100 (Grade: {grade})\n\n"
                f"Executive Summary:\n{summary}\n\n"
                f"Delivered by AI Viva Simulator."
            )

            try:
                msg = MIMEMultipart("alternative")
                msg["Subject"] = f"Viva Voce Report: {project_title} (Score: {score}/100, Grade: {grade})"
                msg["From"] = SMTP_FROM_EMAIL
                msg["To"] = ", ".join(recipients)

                msg.attach(MIMEText(plain_text, "plain", "utf-8"))
                msg.attach(MIMEText(html_content, "html", "utf-8"))

                print(f"[*] Connecting to SMTP server {SMTP_SERVER}:{SMTP_PORT}...")
                with smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=15) as server:
                    server.ehlo()
                    server.starttls()
                    server.ehlo()
                    server.login(SMTP_USER, SMTP_PASSWORD)
                    server.sendmail(SMTP_FROM_EMAIL, recipients, msg.as_string())

                print(f"[+] REAL EMAIL DELIVERED successfully to {recipients}!")

                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({
                    "success": True,
                    "message": f"Real email delivered to {', '.join(recipients)} from {SMTP_FROM_EMAIL} via Gmail SMTP!",
                    "recipients": recipients
                }).encode())

            except Exception as mail_err:
                print(f"[-] SMTP Delivery failed: {mail_err}")
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({
                    "error": f"SMTP Dispatch failed: {str(mail_err)}"
                }).encode())
            return

        self.send_response(404)
        self.end_headers()


def run():
    os.chdir(Path(__file__).parent.resolve())
    server_address = ("", PORT)
    httpd = HTTPServer(server_address, VivaStaticWithEmailHandler)
    print(f"[+] AI Viva Web Server running on http://localhost:{PORT}")
    print(f"[+] Real Gmail SMTP Dispatch active for: {SMTP_FROM_EMAIL}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server.")
        httpd.server_close()


if __name__ == "__main__":
    run()
