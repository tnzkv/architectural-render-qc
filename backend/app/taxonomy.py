"""Architectural facade element taxonomy.

This is the controlled vocabulary the (mock) extraction pipeline and the
comparison engine use to label elements. Real CV/vision-model output should
be normalized into these categories before comparison, so the UI filters and
metrics stay stable regardless of which model produced the detection.
"""

ELEMENT_TYPES = [
    "window",
    "door",
    "garage_door",
    "roof",
    "roof_section",
    "dormer_window",
    "balcony",
    "column",
    "railing",
    "stairs",
    "canopy",
    "terrace",
    "facade_decor",
    "exterior_light",
    "gutter",
    "downspout",
    "chimney",
    "other",
]

# Semantic (non-geometric) discrepancy categories — the app deliberately
# excludes dimension/scale/coordinate mismatches, per the product brief.
ERROR_TYPES = [
    "missing",              # present in drawing, absent in render
    "extra",                # present in render, not in drawing
    "wrong_type",           # element present but wrong subtype (e.g. window style)
    "orientation_mismatch", # e.g. casement swing/hinge side, opening direction
    "count_mismatch",       # e.g. glass panes/sections/panels count differs
    "design_mismatch",      # general design/pattern deviation (e.g. garage door panel layout)
]

REVIEW_STATUSES = ["unreviewed", "tp", "fp", "fn"]
