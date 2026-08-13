"""Shared serialization helpers."""
from sqlalchemy.orm import class_mapper

def serialize(obj):
    if obj is None:
        return None
    if isinstance(obj, dict):
        return obj
    return {c.key: getattr(obj, c.key) for c in class_mapper(obj.__class__).columns}

def serialize_list(docs):
    return [serialize(d) for d in docs]