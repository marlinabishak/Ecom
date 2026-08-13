"""Support & feedback routes."""
import os
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db import get_db
from models import FeedbackInput, TicketInput, TicketReplyInput, UpdateTicketStatusInput
from sql_models import Feedback, Ticket, TicketMessage, Order
from security import get_current_user, get_current_user_optional, require_support
from utils import serialize, serialize_list

router = APIRouter(prefix="/api", tags=["support"])

@router.post("/feedback")
async def submit_feedback(payload: FeedbackInput, db: Session = Depends(get_db), current_user: dict | None = Depends(get_current_user_optional)):
    doc = Feedback(**payload.model_dump(), user_id=current_user["id"] if current_user else None)
    db.add(doc)
    db.commit()
    db.refresh(doc)
    # Mock forward to email
    # TODO: forward to os.environ["FEEDBACK_EMAIL"] via email provider once configured.
    print(f"[feedback] stored for {os.environ.get('FEEDBACK_EMAIL', 'abi@gmail.com')}: {payload.subject}")
    return {"success": True, "id": str(doc.id)}

@router.post("/me/tickets")
async def create_ticket(payload: TicketInput, user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    t = Ticket(
        user_id=int(user["id"]),
        order_id=payload.order_id,
        subject=payload.subject,
        status="open"
    )
    db.add(t)
    db.commit()
    db.refresh(t)
    
    msg = TicketMessage(
        ticket_id=t.id,
        user_id=int(user["id"]),
        message=payload.message,
        is_staff_reply=False
    )
    db.add(msg)
    db.commit()
    
    out = serialize(t)
    out["messages"] = serialize_list(t.messages)
    return out

@router.get("/me/tickets")
async def list_my_tickets(user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    docs = db.query(Ticket).filter(Ticket.user_id == int(user["id"])).order_by(Ticket.created_at.desc()).limit(200).all()
    res = []
    for d in docs:
        out = serialize(d)
        out["messages"] = serialize_list(d.messages)
        res.append(out)
    return res

@router.get("/me/tickets/{tid}")
async def get_my_ticket(tid: int, user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(Ticket).filter(Ticket.id == tid, Ticket.user_id == int(user["id"])).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Ticket not found")
    out = serialize(doc)
    out["messages"] = serialize_list(doc.messages)
    return out

@router.post("/me/tickets/{tid}/reply")
async def reply_ticket_customer(tid: int, payload: TicketReplyInput, user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    t = db.query(Ticket).filter(Ticket.id == tid, Ticket.user_id == int(user["id"])).first()
    if not t:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    msg = TicketMessage(ticket_id=t.id, user_id=int(user["id"]), message=payload.message, is_staff_reply=False)
    db.add(msg)
    db.commit()
    return {"ok": True}

@router.get("/support/tickets")
async def list_all_tickets(_: dict = Depends(require_support), db: Session = Depends(get_db)):
    docs = db.query(Ticket).order_by(Ticket.created_at.desc()).limit(500).all()
    return serialize_list(docs)

@router.get("/support/tickets/{tid}")
async def get_ticket(tid: int, _: dict = Depends(require_support), db: Session = Depends(get_db)):
    doc = db.query(Ticket).filter(Ticket.id == tid).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Ticket not found")
    out = serialize(doc)
    out["messages"] = serialize_list(doc.messages)
    return out

@router.post("/support/tickets/{tid}/reply")
async def reply_ticket(tid: int, payload: TicketReplyInput, user: dict = Depends(require_support), db: Session = Depends(get_db)):
    t = db.query(Ticket).filter(Ticket.id == tid).first()
    if not t:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    msg = TicketMessage(
        ticket_id=t.id,
        user_id=int(user["id"]),
        message=payload.message,
        is_staff_reply=True
    )
    t.status = "in_progress"
    db.add(msg)
    db.commit()
    return {"ok": True}

@router.put("/support/tickets/{tid}/status")
async def update_ticket_status(tid: int, payload: UpdateTicketStatusInput, _: dict = Depends(require_support), db: Session = Depends(get_db)):
    t = db.query(Ticket).filter(Ticket.id == tid).first()
    if not t:
        raise HTTPException(status_code=404, detail="Ticket not found")
    t.status = payload.status
    db.commit()
    return {"ok": True}

@router.get("/support/feedback")
async def support_list_feedback(_: dict = Depends(require_support), db: Session = Depends(get_db)):
    docs = db.query(Feedback).order_by(Feedback.created_at.desc()).limit(500).all()
    return serialize_list(docs)

@router.get("/support/orders")
async def support_view_orders(_: dict = Depends(require_support), db: Session = Depends(get_db)):
    docs = db.query(Order).order_by(Order.created_at.desc()).limit(500).all()
    res = []
    for d in docs:
        out = serialize(d)
        out["items"] = serialize_list(d.items)
        res.append(out)
    return res