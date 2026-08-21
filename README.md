# 한국어 자료실

한국 어린이(초급)와 외국인 학습자(중·고급)를 위한 한국어 학습자료 사이트.

**https://hyejunhyejun.github.io/korean-lessons**

## 구조

```
index.html      목록 홈
lesson.html     자료 뷰어 (모든 자료를 이 파일 하나가 그린다)
assets/         style.css, app.js
lessons/        자료 데이터(JSON) + index.json(목록)
check_lessons.py  자료 검증
```

자료는 JSON으로만 저장하고 화면은 `lesson.html` 하나가 그린다. 디자인을 고칠 곳이 한 군데뿐이다.

## 자료 추가하기

1. `lessons/<id>.json` 을 만든다 (`profile` 은 `kids` 또는 `adult`)
2. `lessons/index.json` 에 항목을 추가한다
3. `python check_lessons.py` 로 확인한다
4. commit & push — 몇 분 뒤 Pages에 반영된다

## 로컬에서 보기

브라우저로 파일을 직접 열면 JSON을 읽지 못한다. 서버로 띄워야 한다.

```bash
python -m http.server 8080
```

그 다음 http://localhost:8080 접속.

## 프로필

|  | kids (초급) | adult (중·고급) |
|---|---|---|
| 대상 | 한국 5세 아이 | 외국인 성인 |
| 구성 | 단어 그림카드 · 따라 읽기 · 써보기 | 어휘 · 읽기 · 문법 · 회화 |
| 영어 | 없음 | EN 버튼으로 켜고 끔 |
| 인쇄 | 써보기 칸만 출력 | — |

발음 듣기는 브라우저 내장 음성합성을 쓴다. 지원하지 않는 기기에서는 버튼이 나타나지 않는다.
