"""Mock element-extraction + comparison engine.

This stands in for the real pipeline described in the README (facade
detection -> structured object model -> semantic diff). It exists so the
rest of the product (review UI, TP/FP/FN workflow, metrics) can be built and
demoed before a real vision model is wired in.

To swap in a real pipeline: replace `run_comparison()` with a call to your
extraction service, and return the same list-of-dict shape consumed by
`app.routers.analysis`. Nothing else in the app needs to change.
"""

import random
from typing import List, Dict, Any

# Pool of realistic discrepancy templates, grounded in the examples from the
# product brief. Each template is expanded with a plausible bbox + a
# jittered confidence score at generation time.
TEMPLATES: List[Dict[str, Any]] = [
    dict(element_type="window", error_type="missing",
         name_fmt="Window {tag}",
         desc="Присутнє на фасадному кресленні, але відсутнє на рендері.",
         needs_drawing=True, needs_render=False),
    dict(element_type="window", error_type="extra",
         name_fmt="Window {tag}",
         desc="На рендері з'явилося вікно, якого немає на кресленні.",
         needs_drawing=False, needs_render=True),
    dict(element_type="window", error_type="wrong_type",
         name_fmt="Window {tag}",
         desc="На кресленні одностулкове вікно, на рендері — двостулкове (інший тип конструкції).",
         needs_drawing=True, needs_render=True),
    dict(element_type="window", error_type="orientation_mismatch",
         name_fmt="Window {tag}",
         desc="На кресленні стулка відкривається вправо, на рендері — вліво.",
         needs_drawing=True, needs_render=True),
    dict(element_type="window", error_type="count_mismatch",
         name_fmt="Window {tag}",
         desc="На кресленні три секції скла, на рендері — дві.",
         needs_drawing=True, needs_render=True),
    dict(element_type="dormer_window", error_type="missing",
         name_fmt="Dormer {tag}",
         desc="Мансардне вікно є на кресленні даху, але відсутнє на рендері.",
         needs_drawing=True, needs_render=False),
    dict(element_type="door", error_type="wrong_type",
         name_fmt="Entry Door {tag}",
         desc="Тип вхідних дверей на рендері не відповідає кресленню (інша філенка/скління).",
         needs_drawing=True, needs_render=True),
    dict(element_type="garage_door", error_type="design_mismatch",
         name_fmt="Garage Door {tag}",
         desc="Конфігурація панелей гаражних воріт не відповідає кресленню.",
         needs_drawing=True, needs_render=True),
    dict(element_type="roof_section", error_type="missing",
         name_fmt="Roof Section {tag}",
         desc="На кресленні є дах над цією частиною будинку, на рендері він відсутній.",
         needs_drawing=True, needs_render=False),
    dict(element_type="chimney", error_type="missing",
         name_fmt="Chimney {tag}",
         desc="Димохід присутній на кресленні, але відсутній на рендері.",
         needs_drawing=True, needs_render=False),
    dict(element_type="balcony", error_type="wrong_type",
         name_fmt="Balcony {tag}",
         desc="Форма балкона на рендері відрізняється від креслення.",
         needs_drawing=True, needs_render=True),
    dict(element_type="railing", error_type="wrong_type",
         name_fmt="Railing {tag}",
         desc="Інший тип огорожі/перил порівняно з кресленням (суцільна панель замість балясин).",
         needs_drawing=True, needs_render=True),
    dict(element_type="canopy", error_type="missing",
         name_fmt="Canopy {tag}",
         desc="Навіс над входом присутній на кресленні, але відсутній на рендері.",
         needs_drawing=True, needs_render=False),
    dict(element_type="column", error_type="extra",
         name_fmt="Column {tag}",
         desc="На рендері зайва колона, якої немає на кресленні.",
         needs_drawing=False, needs_render=True),
    dict(element_type="facade_decor", error_type="missing",
         name_fmt="Decorative Beam {tag}",
         desc="Декоративні балки з креслення відсутні на рендері.",
         needs_drawing=True, needs_render=False),
    dict(element_type="facade_decor", error_type="wrong_type",
         name_fmt="Facade Cladding {tag}",
         desc="Тип фасадного оздоблення на рендері не відповідає кресленню.",
         needs_drawing=True, needs_render=True),
    dict(element_type="exterior_light", error_type="missing",
         name_fmt="Exterior Light {tag}",
         desc="Зовнішній світильник вказаний на кресленні, але відсутній на рендері.",
         needs_drawing=True, needs_render=False),
    dict(element_type="gutter", error_type="missing",
         name_fmt="Gutter Run {tag}",
         desc="Ринва вздовж карниза присутня на кресленні, але не відображена на рендері.",
         needs_drawing=True, needs_render=False),
    dict(element_type="downspout", error_type="extra",
         name_fmt="Downspout {tag}",
         desc="На рендері зайвий водостік, якого немає на кресленні.",
         needs_drawing=False, needs_render=True),
    dict(element_type="stairs", error_type="wrong_type",
         name_fmt="Stairs {tag}",
         desc="Конфігурація сходів (кількість маршів) на рендері відрізняється від креслення.",
         needs_drawing=True, needs_render=True),
    dict(element_type="terrace", error_type="wrong_type",
         name_fmt="Terrace {tag}",
         desc="Форма/огородження тераси на рендері відрізняється від креслення.",
         needs_drawing=True, needs_render=True),
]

TAGS = ["A-1", "A-2", "B-1", "B-2", "C-1", "N-01", "S-02", "E-03", "W-04", "12", "07", "R-1"]


def _rand_bbox(rng: random.Random) -> Dict[str, float]:
    w = rng.uniform(0.05, 0.18)
    h = rng.uniform(0.06, 0.2)
    x = rng.uniform(0.02, max(0.02, 1 - w - 0.02))
    y = rng.uniform(0.05, max(0.05, 1 - h - 0.1))
    return {"x": round(x, 4), "y": round(y, 4), "w": round(w, 4), "h": round(h, 4)}


def run_comparison(run_id: int, seed_extra: int = 0) -> List[Dict[str, Any]]:
    """Generate a plausible, varied set of discrepancies for a run.

    Deterministic per (run_id) so re-fetching a run is stable, but different
    runs produce different findings, similar to how a real model would react
    to different inputs.
    """
    rng = random.Random(1000 + run_id * 31 + seed_extra)
    n = rng.randint(5, 10)
    chosen = rng.sample(TEMPLATES, k=min(n, len(TEMPLATES)))

    results = []
    for i, tpl in enumerate(chosen):
        tag = rng.choice(TAGS)
        drawing_bbox = _rand_bbox(rng) if tpl["needs_drawing"] else None
        render_bbox = _rand_bbox(rng) if tpl["needs_render"] else None
        confidence = round(rng.uniform(0.62, 0.98), 2)

        results.append(dict(
            element_name=tpl["name_fmt"].format(tag=tag),
            element_type=tpl["element_type"],
            error_type=tpl["error_type"],
            description=tpl["desc"],
            confidence=confidence,
            drawing_bbox=drawing_bbox,
            render_bbox=render_bbox,
        ))
    return results
