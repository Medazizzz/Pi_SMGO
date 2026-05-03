from __future__ import annotations

import json
from pathlib import Path
from urllib import request

BASE_DIR = Path(__file__).resolve().parent
SAMPLE_PATH = BASE_DIR / "sample_request.json"


def main() -> None:
    payload = json.loads(SAMPLE_PATH.read_text(encoding="utf-8"))
    req = request.Request(
        "http://127.0.0.1:5055/recommend",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with request.urlopen(req, timeout=30) as response:
        print(json.dumps(json.loads(response.read().decode("utf-8")), indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
