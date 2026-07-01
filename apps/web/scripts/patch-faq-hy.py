# -*- coding: utf-8 -*-
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "src/features/landing/landingFaqContent.ts"

FIXES: dict[str, str] = {
    "class-sizes": (
        "Խմբերը սովորաբար 6–10 ուսանող են բաղկանում։ "
        "Փոքր խմբերը ավելi շat khoselu hnaravorutyun, anhatakan aragani ev azhaktsogh mijavayr en apahovum, vortegh bolor@ masnaktsum en."
    ),
}
