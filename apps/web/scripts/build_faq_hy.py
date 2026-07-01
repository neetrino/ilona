# -*- coding: utf-8 -*-
import json
from pathlib import Path

ANSWERS_HY = [
    "Մenք arajarkum enq 6 tariakanic minchev metsahasakner.",
]

if __name__ == "__main__":
    out = Path(__file__).resolve().parents[1] / "scripts/faq-hy-escaped.json"
    out.write_text(
        json.dumps(
            [
                "".join(f"\\u{ord(c):04x}" for c in text)
                for text in ANSWERS_HY
            ],
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
