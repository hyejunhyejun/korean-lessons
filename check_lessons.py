"""자료 JSON이 온전한지 검사한다.

    python check_lessons.py

문제가 있으면 하나씩 출력하고 종료 코드 1을 돌려준다.
"""

import json
import sys
from pathlib import Path

LESSONS = Path(__file__).parent / "lessons"

COMMON = ["id", "profile", "topic", "title", "emoji", "level", "created"]
REQUIRED = {
    "kids": ["cards", "sentences", "writing"],
    "adult": ["vocab", "reading", "grammar", "dialogue"],
}


def check_file(path, problems):
    try:
        d = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        problems.append(f"{path.name}: JSON 형식이 깨졌습니다 ({e})")
        return None

    for key in COMMON:
        if not d.get(key):
            problems.append(f"{path.name}: '{key}' 항목이 없습니다")

    profile = d.get("profile")
    if profile not in REQUIRED:
        problems.append(f"{path.name}: profile 은 kids 또는 adult 여야 합니다 (지금: {profile!r})")
        return d

    for key in REQUIRED[profile]:
        if not d.get(key):
            problems.append(f"{path.name}: {profile} 자료에 '{key}' 가 없습니다")

    if d.get("id") != path.stem:
        problems.append(f"{path.name}: id({d.get('id')!r}) 와 파일 이름이 다릅니다")

    # 어린이 자료는 카드마다 그림이 있어야 한다.
    for c in d.get("cards", []):
        if not c.get("emoji"):
            problems.append(f"{path.name}: '{c.get('word')}' 카드에 그림(emoji)이 없습니다")

    # 외국인 자료는 문제의 정답 번호가 보기 범위 안이어야 한다.
    for i, q in enumerate(d.get("reading", {}).get("questions", []), 1):
        n = len(q.get("choices", []))
        if not isinstance(q.get("answer"), int) or not 0 <= q["answer"] < n:
            problems.append(f"{path.name}: {i}번 문제의 정답 번호가 보기 범위를 벗어났습니다")

    return d


def main():
    problems = []
    files = sorted(p for p in LESSONS.glob("*.json") if p.name != "index.json")

    found = {}
    for path in files:
        d = check_file(path, problems)
        if d:
            found[path.stem] = d

    index_path = LESSONS / "index.json"
    try:
        index = json.loads(index_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as e:
        problems.append(f"index.json 을 읽을 수 없습니다 ({e})")
        index = []

    listed = {x.get("id") for x in index}
    for missing in found.keys() - listed:
        problems.append(f"{missing}.json 이 index.json 에 빠져 있습니다")
    for ghost in listed - found.keys():
        problems.append(f"index.json 의 '{ghost}' 에 해당하는 자료 파일이 없습니다")

    if problems:
        print(f"문제 {len(problems)}건:")
        for p in problems:
            print("  -", p)
        sys.exit(1)

    print(f"자료 {len(found)}편 모두 정상입니다.")


if __name__ == "__main__":
    main()
