from __future__ import annotations

from pathlib import Path
import textwrap

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

BASE_DIR = Path(__file__).resolve().parent
OUTPUT_PDF = BASE_DIR / "implementation_guide.pdf"


def build_story():
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "TitleStyle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#111827"),
        spaceAfter=12,
    )
    h1 = ParagraphStyle(
        "H1",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=15,
        leading=18,
        textColor=colors.HexColor("#0f172a"),
        spaceBefore=10,
        spaceAfter=6,
    )
    h2 = ParagraphStyle(
        "H2",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=15,
        textColor=colors.HexColor("#1f2937"),
        spaceBefore=8,
        spaceAfter=4,
    )
    body = ParagraphStyle(
        "Body",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=12,
        spaceAfter=4,
    )
    mono = ParagraphStyle(
        "Mono",
        parent=body,
        fontName="Courier",
        fontSize=8.4,
        leading=10,
    )

    story = []

    story.append(Paragraph("SMGO Implementation Guide", title_style))
    story.append(Paragraph("A line-by-line technical walkthrough of the features we implemented so you can explain, reproduce, or defend the design in questions or interviews.", body))
    story.append(Spacer(1, 0.4 * cm))

    story.append(Paragraph("1. What was implemented", h1))
    rows = [
        ["Feature", "What it does"],
        ["Top 10 Content", "Exposes a dedicated backend /api/contents/top10 endpoint and wires the frontend to it."],
        ["Multi-channel notifications", "Creates in-app notifications immediately and sends an email fallback after a delay if unread."],
        ["AI recommendations", "Uses a real Python XGBoost service with joblib persistence and a Java-to-Python bridge."],
    ]
    table = Table(rows, colWidths=[4.2 * cm, 11.3 * cm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1f2937")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8.8),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#d1d5db")),
        ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#f9fafb")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(table)
    story.append(Spacer(1, 0.3 * cm))

    story.append(Paragraph("2. Multi-channel notifications", h1))
    multi_sections = [
        ("Data model", [
            "The notification entity now stores fallback timing fields: emailFallbackDueAt, emailFallbackSentAt, and a boolean emailFallbackSent flag.",
            "That means the system knows when to send fallback email and whether it already did it.",
        ]),
        ("Repository query", [
            "A Mongo repository method finds unread notifications where fallback was not sent and the due time has already passed.",
            "That is the scheduler’s selection set.",
        ]),
        ("Service flow", [
            "createNotification saves the record with isRead=false and emailFallbackDueAt = now + configured delay.",
            "markAsRead sets emailFallbackSent=true so a later fallback run will ignore already-read notifications.",
            "sendEmail uses JavaMailSender and SimpleMailMessage to send a real SMTP email.",
            "A scheduled method runs every minute and reuses the same fallback processor.",
        ]),
        ("Manual test hook", [
            "The /api/notifications/test/trigger-email-fallback endpoint lets you force the fallback processor immediately for testing.",
        ]),
        ("Configuration", [
            "application.properties stores the SMTP host, Gmail username, app password placeholder, sender address, and delay settings.",
        ]),
    ]
    for title, bullets in multi_sections:
        story.append(Paragraph(title, h2))
        for bullet in bullets:
            story.append(Paragraph(f"- {bullet}", body))

    story.append(Paragraph("3. Top 10 content", h1))
    top10_points = [
        "The service contract adds getTop10Content(category, genreKeyword).",
        "The controller exposes GET /api/contents/top10.",
        "The implementation reuses the analytics repository query and hard-limits it to 10 items.",
        "The frontend admin advanced page now calls the dedicated endpoint instead of sorting locally only.",
    ]
    for point in top10_points:
        story.append(Paragraph(f"- {point}", body))

    story.append(Paragraph("4. XGBoost AI recommender", h1))
    ai_points = [
        "train_model.py creates a messy dataset with duplicates and missing values, then cleans it using dropna() and drop_duplicates().",
        "The cleaned data is split into train and test sets, one-hot encoded for categorical fields, and trained with XGBRegressor.",
        "The trained pipeline is saved with joblib to ai-service/model/content_recommender.joblib.",
        "app.py loads the saved model; if loading fails, it retrains automatically.",
        "The /recommend endpoint builds a feature row from the user profile and each content item, predicts scores, and returns ranked recommendations.",
        "The Java backend calls the Flask /recommend service from ContentServiceImpl and falls back to local heuristic scoring if the service is unavailable.",
    ]
    for point in ai_points:
        story.append(Paragraph(f"- {point}", body))

    story.append(Paragraph("5. Key code paths", h1))
    code_paths = [
        ["Backend content API", "ContentController -> ContentService -> ContentServiceImpl -> Python AI service"],
        ["Notification flow", "NotificationController -> NotificationServiceImpl -> NotificationRepository -> SMTP"],
        ["AI training flow", "train_model.py -> joblib model -> app.py -> /recommend"],
    ]
    table2 = Table(code_paths, colWidths=[4.5 * cm, 11.0 * cm])
    table2.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#eff6ff")),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#d1d5db")),
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 8.8),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(table2)

    story.append(Paragraph("6. How to explain it in an interview", h1))
    interview_points = [
        "The top 10 feature is now a real API backed by analytics, not just a frontend sort.",
        "The notification system is multi-channel: in-app immediately, email later if unread.",
        "The AI recommender is truly trained, not hard-coded. It learns from synthetic interaction labels and predicts ranking scores.",
        "The Java backend is resilient because it can fall back to local recommendation logic if the Python service is down.",
        "The data pipeline is reproducible because it generates messy data, cleans it, trains, and stores the model consistently.",
    ]
    for point in interview_points:
        story.append(Paragraph(f"- {point}", body))

    story.append(Paragraph("7. Validation we already ran", h1))
    validation_points = [
        "Backend compile succeeded with Maven.",
        "The Flask AI service health endpoint returned status ok and metrics.",
        "The Python sample client returned ranked recommendations from the XGBoost model.",
        "The Java recommendation endpoint returned AI-backed results from the running backend.",
    ]
    for point in validation_points:
        story.append(Paragraph(f"- {point}", body))

    story.append(Paragraph("8. Best next improvement", h1))
    story.append(Paragraph(
        "If you want the recommender to be stronger, the best upgrade is a hybrid model: keep XGBoost for ranking, add collaborative signals from reservations/watch activity, and include time-based or session-based context. That is better than category/type alone.",
        body,
    ))

    story.append(Paragraph("9. Scheduled Newsletter Campaign", h1))
    newsletter_points = [
        "This is a separate campaign system, not the unread-email fallback notification flow.",
        "A newsletter campaign is stored in its own Mongo collection and exposed through /api/newsletters.",
        "When the scheduled time arrives, the service creates in-app notifications directly and sends email immediately if enabled.",
        "Because the newsletter notifications are saved with emailFallbackSent=true, they do not enter the delayed unread-email fallback logic.",
        "The admin notifications page now includes a newsletter scheduling modal and a campaign table.",
        "Audience targeting can be all users, a content category, or genre names inferred from reservation history.",
    ]
    for point in newsletter_points:
        story.append(Paragraph(f"- {point}", body))

    story.append(Paragraph("Newsletter flow", h2))
    newsletter_flow = [
        "Create campaign -> store scheduledAt and filters",
        "Scheduler finds due campaigns",
        "Service resolves target users",
        "Create in-app notifications directly",
        "Send SMTP email immediately if enabled",
    ]
    for step in newsletter_flow:
        story.append(Paragraph(f"- {step}", body))

    story.append(Paragraph("10. Line-reference appendix", h1))
    appendix_rows = [
        ["File", "Important lines", "What to say"],
        ["backend/src/main/java/com/example/contentmanagement/service/impl/NotificationServiceImpl.java", "L29-L37, L54-L61, L108-L119, L129-L176, L204", "This is where SMTP, fallback scheduling, and mark-as-read protection happen."],
        ["backend/src/main/java/com/example/contentmanagement/controller/NotificationController.java", "L86-L90", "This is the manual trigger endpoint for fallback testing."],
        ["backend/src/main/java/com/example/contentmanagement/entity/Notification.java", "L33-L41", "These fields track when fallback should happen and whether it already happened."],
        ["backend/src/main/java/com/example/contentmanagement/controller/ContentController.java", "L131-L135", "This is the explicit Top 10 API route."],
        ["backend/src/main/java/com/example/contentmanagement/service/impl/ContentServiceImpl.java", "L50, L157, L387-L508", "This class now calls the Python recommender and falls back if needed."],
        ["backend/src/main/java/com/example/contentmanagement/service/impl/NewsletterCampaignServiceImpl.java", "L38-L134", "This is the scheduled newsletter campaign flow and dispatcher."],
        ["backend/src/main/java/com/example/contentmanagement/controller/NewsletterCampaignController.java", "L16-L55", "This is the newsletter API used by the admin page."],
        ["ai-service/train_model.py", "L65-L236", "This is the XGBoost training pipeline and model save path."],
        ["ai-service/app.py", "L19-L28, L144-L192", "This is the Flask inference service and live recommendation API."],
    ]
    appendix = Table(appendix_rows, colWidths=[6.2 * cm, 3.5 * cm, 7.0 * cm])
    appendix.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#111827")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 7.8),
        ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#d1d5db")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(appendix)

    story.append(Spacer(1, 0.2 * cm))
    story.append(Paragraph("Important files", h1))
    files = [
        "backend/src/main/java/com/example/contentmanagement/service/impl/ContentServiceImpl.java",
        "backend/src/main/java/com/example/contentmanagement/controller/ContentController.java",
        "backend/src/main/java/com/example/contentmanagement/service/impl/NotificationServiceImpl.java",
        "backend/src/main/java/com/example/contentmanagement/controller/NotificationController.java",
        "ai-service/train_model.py",
        "ai-service/app.py",
        "new features.md",
    ]
    for file_name in files:
        story.append(Paragraph(f"- {file_name}", body))

    return story


def main() -> None:
    doc = SimpleDocTemplate(
        str(OUTPUT_PDF),
        pagesize=A4,
        rightMargin=1.6 * cm,
        leftMargin=1.6 * cm,
        topMargin=1.5 * cm,
        bottomMargin=1.5 * cm,
    )
    story = build_story()
    doc.build(story)
    print(f"Created PDF: {OUTPUT_PDF}")


if __name__ == "__main__":
    main()
