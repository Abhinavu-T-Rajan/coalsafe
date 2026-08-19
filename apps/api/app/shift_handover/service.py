"""Shift Handover Log Service with Cryptographic Hashing and Statutory PDF Generation."""
import datetime
import hashlib
import io
import json
import uuid
from typing import Dict, List, Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import HRFlowable, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.shift_handover.models import (
    CreateShiftLogRequest,
    HandoverSignoffRequest,
    HandoverStatus,
    LogCategory,
    LogType,
    RedFlag,
    ShiftLog,
)


class ShiftHandoverService:
    """Manages digital shift logs, red flags, handover sign-offs, and PDF exports."""

    def __init__(self):
        self._logs: Dict[str, ShiftLog] = {}

    def _compute_hash(self, log_dict: dict) -> str:
        """Computes SHA-256 hash of the statutory log for tamper detection."""
        serialized = json.dumps(log_dict, sort_keys=True, default=str)
        return hashlib.sha256(serialized.encode("utf-8")).hexdigest()

    def list_logs(self, log_type: Optional[LogType] = None) -> List[ShiftLog]:
        """Returns all submitted shift logs, sorted newest first."""
        logs = list(self._logs.values())
        if log_type:
            logs = [item for item in logs if item.logType == log_type]
        return sorted(logs, key=lambda x: x.createdAt, reverse=True)

    def get_log(self, log_id: str) -> Optional[ShiftLog]:
        """Retrieves a specific shift log by ID."""
        return self._logs.get(log_id)

    def create_log(self, req: CreateShiftLogRequest) -> ShiftLog:
        """Creates a new digital statutory shift log, flags safety anomalies, and computes hash."""
        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        prefix = req.logType.split("_")[0]
        log_id = f"LOG-{prefix}-{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}"

        cmr_ref = {
            LogType.OVERMAN_LOG: "CMR 2017 Reg 48 (Duties of Overman)",
            LogType.MINING_SIRDAR_LOG: "CMR 2017 Reg 47 (Duties of Sirdar)",
            LogType.VENTILATION_OFFICER_LOG: "CMR 2017 Reg 51 (Duties of Ventilation Officer)",
            LogType.ELECTRICAL_MECHANICAL_LOG: "CMR 2017 Reg 53 (Duties of Engineers & Electricians)",
            LogType.HEMM_OPERATOR_LOG: "CMR 2017 Reg 55 & DGMS Circ 05/2018",
            LogType.PUMPING_LOG: "CMR 2017 Reg 149 (Dewatering Standards)",
        }.get(req.logType, "CMR 2017 Statutory Log")

        red_flags: List[RedFlag] = []
        for rf_data in req.redFlags:
            red_flags.append(
                RedFlag(
                    id=f"RF-{uuid.uuid4().hex[:6].upper()}",
                    severity=rf_data.get("severity", "HIGH"),
                    title=rf_data.get("title", "Safety Anomaly"),
                    description=rf_data.get("description", ""),
                    location=rf_data.get("location", req.districtSection),
                    actionRequiredForIncoming=rf_data.get("actionRequiredForIncoming", "Immediate verification required"),
                    acknowledgedByIncoming=False,
                )
            )

        # Automatic detection of red flags from gas readings
        for g in req.gasReadings:
            if g.ch4Percent >= 0.75 and not any("CH4" in rf.title for rf in red_flags):
                red_flags.append(
                    RedFlag(
                        id=f"RF-{uuid.uuid4().hex[:6].upper()}",
                        severity="CRITICAL" if g.ch4Percent >= 1.25 else "WARNING",
                        title=f"Elevated Methane ({g.ch4Percent:.2f}%) at {g.location}",
                        description=f"CH4 level of {g.ch4Percent:.2f}% recorded during inspection.",
                        location=g.location,
                        actionRequiredForIncoming="Inspect auxiliary ventilation ducting and verify electrical isolation.",
                        acknowledgedByIncoming=False,
                    )
                )

        log_data = req.model_dump()
        log_data["id"] = log_id
        log_data["category"] = LogCategory.STATUTORY
        log_data["cmrRegulationRef"] = cmr_ref
        log_data["redFlags"] = [rf.model_dump() for rf in red_flags]
        log_data["handoverStatus"] = HandoverStatus.PENDING_HANDOVER
        log_data["createdAt"] = now_str
        log_data["sha256Hash"] = self._compute_hash(log_data)

        new_log = ShiftLog(**log_data)
        self._logs[log_id] = new_log
        return new_log

    def complete_handover(self, req: HandoverSignoffRequest) -> Optional[ShiftLog]:
        """Acknowledge and sign off on shift handover by the incoming supervisor."""
        log = self._logs.get(req.logId)
        if not log:
            return None

        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # Mark accepted red flags
        for rf in log.redFlags:
            if rf.id in req.acceptedRedFlagIds or len(req.acceptedRedFlagIds) == 0:
                rf.acknowledgedByIncoming = True
                rf.acknowledgedAt = now_str

        log.handoverStatus = HandoverStatus.ACKNOWLEDGED_AND_ACCEPTED
        log.incomingSupervisorName = req.incomingSupervisorName
        log.incomingSupervisorRole = req.incomingSupervisorRole
        log.incomingSupervisorPin = f"***{req.incomingSupervisorPin[-2:]}" if len(req.incomingSupervisorPin) >= 2 else "***"
        log.handoverCompletedAt = now_str
        log.handoverNotes = req.handoverNotes or "All statutory parameters, red flags, and pending actions acknowledged."

        # Re-compute hash after sign-off for cryptographic audit
        log.sha256Hash = self._compute_hash(log.model_dump())
        return log

    def generate_pdf_report(self, log_id: str) -> Optional[bytes]:
        """Generates a high-quality statutory PDF handover document using ReportLab."""
        log = self._logs.get(log_id)
        if not log:
            return None

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36,
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle("TitleStyle", parent=styles["Heading1"], fontSize=16, textColor=colors.HexColor("#0f172a"), spaceAfter=4, alignment=1)
        sub_style = ParagraphStyle("SubStyle", parent=styles["Normal"], fontSize=9, textColor=colors.HexColor("#475569"), alignment=1, spaceAfter=12)
        h2_style = ParagraphStyle("H2Style", parent=styles["Heading2"], fontSize=11, textColor=colors.HexColor("#1e293b"), spaceBefore=8, spaceAfter=4)
        body_style = ParagraphStyle("BodyStyle", parent=styles["Normal"], fontSize=9, textColor=colors.HexColor("#334155"), leading=12)
        bold_body = ParagraphStyle("BoldBody", parent=styles["Normal"], fontSize=9, fontName="Helvetica-Bold", textColor=colors.HexColor("#0f172a"))
        red_flag_style = ParagraphStyle("RedFlag", parent=styles["Normal"], fontSize=9, textColor=colors.HexColor("#b91c1c"), fontName="Helvetica-Bold")

        story = []

        # 1. Header
        story.append(Paragraph("MINISTRY OF COAL • DIRECTORATE GENERAL OF MINES SAFETY", sub_style))
        story.append(Paragraph("DIGITAL STATUTORY SHIFT HANDOVER LOGBOOK", title_style))
        story.append(Paragraph(f"Statutory Standard: {log.cmrRegulationRef} | Colliery: {log.mineName}", sub_style))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#f59e0b"), spaceAfter=10))

        # 2. Meta Information Table
        meta_data = [
            [Paragraph("Log Ref ID:", bold_body), Paragraph(log.id, body_style), Paragraph("Date & Shift:", bold_body), Paragraph(f"{log.date} ({log.shift.replace('_', ' ')})", body_style)],
            [Paragraph("Seam & District:", bold_body), Paragraph(f"{log.seamName} - {log.districtSection}", body_style), Paragraph("Manpower Deployed:", bold_body), Paragraph(f"{log.manpowerDeployed} Workers", body_style)],
            [Paragraph("Outgoing Official:", bold_body), Paragraph(f"{log.outgoingSupervisorName} ({log.outgoingSupervisorRole})", body_style), Paragraph("Certificate No:", bold_body), Paragraph(log.outgoingSupervisorCertNo, body_style)],
            [Paragraph("Production:", bold_body), Paragraph(f"{log.productionTonnage:.1f} Tonnage", body_style), Paragraph("Handover Status:", bold_body), Paragraph(log.handoverStatus.replace("_", " "), bold_body)],
        ]
        meta_table = Table(meta_data, colWidths=[1.3 * inch, 2.3 * inch, 1.4 * inch, 2.3 * inch])
        meta_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ])
        )
        story.append(meta_table)
        story.append(Spacer(1, 10))

        # 3. Critical Red Flags Banner
        if log.redFlags:
            story.append(Paragraph("CRITICAL SAFETY RED FLAGS (MANDATORY ACKNOWLEDGMENT)", h2_style))
            rf_data = [[Paragraph("Severity", bold_body), Paragraph("Location & Hazard", bold_body), Paragraph("Required Action for Incoming Shift", bold_body), Paragraph("Ack", bold_body)]]
            for rf in log.redFlags:
                rf_data.append([
                    Paragraph(rf.severity, red_flag_style),
                    Paragraph(f"<b>{rf.title}</b><br/>{rf.description} (Loc: {rf.location})", body_style),
                    Paragraph(rf.actionRequiredForIncoming, body_style),
                    Paragraph("YES" if rf.acknowledgedByIncoming else "PENDING", bold_body),
                ])
            rf_table = Table(rf_data, colWidths=[0.9 * inch, 3.2 * inch, 2.6 * inch, 0.6 * inch])
            rf_table.setStyle(
                TableStyle([
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#fee2e2")),
                    ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#ef4444")),
                    ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#fca5a5")),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("TOPPADDING", (0, 0), (-1, -1), 4),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ])
            )
            story.append(rf_table)
            story.append(Spacer(1, 10))

        # 4. Environmental & Gas Telemetry
        if log.gasReadings:
            story.append(Paragraph("Environmental Gas & Ventilation Inspection", h2_style))
            gas_data = [[Paragraph("Sample Location", bold_body), Paragraph("CH4 (%)", bold_body), Paragraph("CO (ppm)", bold_body), Paragraph("O2 (%)", bold_body), Paragraph("Airflow (m/s)", bold_body), Paragraph("Status", bold_body)]]
            for g in log.gasReadings:
                gas_data.append([
                    Paragraph(g.location, body_style),
                    Paragraph(f"{g.ch4Percent:.2f}%", bold_body if g.ch4Percent >= 0.75 else body_style),
                    Paragraph(f"{g.coPpm:.1f}", bold_body if g.coPpm >= 50 else body_style),
                    Paragraph(f"{g.o2Percent:.1f}%", body_style),
                    Paragraph(f"{g.airVelocityMps:.2f}", body_style),
                    Paragraph(g.status, bold_body),
                ])
            gas_table = Table(gas_data, colWidths=[2.2 * inch, 1.0 * inch, 1.0 * inch, 1.0 * inch, 1.1 * inch, 1.0 * inch])
            gas_table.setStyle(
                TableStyle([
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
                    ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                    ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                    ("TOPPADDING", (0, 0), (-1, -1), 4),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ])
            )
            story.append(gas_table)
            story.append(Spacer(1, 10))

        # 5. Strata, Water & Operational Observations
        story.append(Paragraph("Statutory Section Observations", h2_style))
        obs_data = [
            [Paragraph("Strata & Roof Condition:", bold_body), Paragraph(log.strataConditionSummary, body_style)],
            [Paragraph("Ventilation Adequacy:", bold_body), Paragraph(log.ventilationAdequacy, body_style)],
            [Paragraph("Water & Dewatering:", bold_body), Paragraph(log.waterAccumulationStatus, body_style)],
            [Paragraph("Pending Priority Actions:", bold_body), Paragraph("<br/>• ".join([""] + log.pendingActionsForNextShift), body_style)],
        ]
        obs_table = Table(obs_data, colWidths=[1.8 * inch, 5.5 * inch])
        obs_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ])
        )
        story.append(obs_table)
        story.append(Spacer(1, 12))

        # 6. Digital Signatures & Non-Repudiation Box
        sign_data = [
            [
                Paragraph("<b>OUTGOING SHIFT IN-CHARGE</b><br/>"
                          f"Name: {log.outgoingSupervisorName}<br/>"
                          f"Role: {log.outgoingSupervisorRole}<br/>"
                          f"Cert: {log.outgoingSupervisorCertNo}<br/>"
                          f"Signed: {log.createdAt}", body_style),
                Paragraph("<b>INCOMING SHIFT IN-CHARGE</b><br/>"
                          f"Name: {log.incomingSupervisorName or 'PENDING ACKNOWLEDGMENT'}<br/>"
                          f"Role: {log.incomingSupervisorRole or 'Shift In-Charge'}<br/>"
                          f"Handover Date: {log.handoverCompletedAt or 'Pending'}<br/>"
                          f"Notes: {log.handoverNotes or 'Awaiting Handover'}", body_style),
            ]
        ]
        sign_table = Table(sign_data, colWidths=[3.65 * inch, 3.65 * inch])
        sign_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f1f5f9")),
                ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#94a3b8")),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ])
        )
        story.append(sign_table)
        story.append(Spacer(1, 10))

        # 7. Cryptographic Footer
        hash_text = f"Cryptographic Verification (SHA-256): {log.sha256Hash}<br/>Generated by COALSAFE Digital Mine Safety Operating System • Compliant with DGMS CMR 2017"
        story.append(Paragraph(hash_text, ParagraphStyle("HashStyle", parent=styles["Normal"], fontSize=7, textColor=colors.HexColor("#64748b"), alignment=1)))

        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()


shift_handover_service = ShiftHandoverService()
