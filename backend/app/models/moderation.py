from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, func
from sqlalchemy.orm import relationship
from app.database.base import Base


class ModerationResult(Base):
    __tablename__ = "moderation_results"

    id = Column(Integer, primary_key=True, index=True)
    content_type = Column(String, nullable=False)  # "comment" or "message"
    content_id = Column(Integer, nullable=False, index=True)
    toxicity_score = Column(Float, default=0.0)
    category = Column(String, default="safe", index=True)
    severity = Column(String, default="Safe", index=True)
    confidence = Column(Float, default=0.0)
    created_at = Column(DateTime, server_default=func.now())


class Violation(Base):
    __tablename__ = "violations"

    id = Column(Integer, primary_key=True, index=True)
    user_identifier = Column(String, nullable=False, index=True)
    violation_type = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    alert_type = Column(String, nullable=False)
    severity = Column(String, nullable=False, index=True)
    content_preview = Column(String, nullable=True)
    status = Column(String, default="unread", index=True)
    created_at = Column(DateTime, server_default=func.now(), index=True)

    user = relationship("User", back_populates="alerts")


class EmergencyReport(Base):
    __tablename__ = "emergency_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    risk_score = Column(Float, default=0.0)
    severity = Column(String, nullable=False)
    report_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), index=True)

    user = relationship("User", back_populates="emergency_reports")


class EmailLog(Base):
    __tablename__ = "email_logs"

    id = Column(Integer, primary_key=True, index=True)
    recipient = Column(String, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    incident_type = Column(String, nullable=False)
    status = Column(String, nullable=False)
    sent_at = Column(DateTime, server_default=func.now(), index=True)

    user = relationship("User", back_populates="email_logs")