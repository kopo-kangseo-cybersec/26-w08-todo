# guide.md — To-Do 리스트, PRD 하나로 두 가지 디자인 비교 (`26-w08-todo`)

> 이 문서는 실습 중 계속 펴놓고 따라가는 매뉴얼입니다. **잘 쓴 PRD 하나로 Bootstrap 버전과 Tailwind 버전을 브랜치를 나눠 만들고**, 나은 쪽을 골라 완성합니다.
> "이번 주 처음 쓰는 것"(Codespaces, Bootstrap, Tailwind CSS, PRD 검토)에 대한 개념 설명은 **주차 폴더 안내판(README.md)**을 참고하세요.

## 왜 오늘은 "같은 PRD로 두 번" 만드나요

6주차 지뢰찾기에서는 PRD가 **있을 때와 없을 때**의 차이를 확인했습니다. 오늘은 한 걸음 더 나아가 **PRD를 잘 쓰는 데** 시간을 씁니다. 그리고 그 PRD를 그대로 두고 디자인 도구(CSS 프레임워크)만 바꿔서 두 번 만들어봅니다. 요구사항이 같으니, 결과물의 차이는 오직 도구의 차이입니다.

## 오늘의 브랜치 구조

```
main               (원본 보관 — 절대 merge하지 않습니다)
 └─ dev            (작업 통합 브랜치 — PRD.md를 여기서 완성)
     ├─ bootstrap  (PRD + Bootstrap 버전)
     ├─ tailwind   (PRD + Tailwind 버전)
     │     ↓ 둘 중 나은 쪽만 dev로 merge → dev에서 보완 작업 → README 작성
     └─ gh-pages   (완성된 dev를 merge해서 GitHub Pages로 배포)
```

- `main`은 처음 Fork했을 때 상태 그대로 보관하는 원본입니다. 실습 중 어떤 브랜치도 `main`으로 merge하지 않습니다.
- `PRD.md`를 `dev`에 먼저 커밋한 뒤 두 브랜치를 나누기 때문에, `bootstrap`과 `tailwind`는 **똑같은 PRD에서 출발**합니다.

---

### 1단계 — Fork & Codespaces 열기

1. `26-w08-todo` 저장소를 본인 GitHub 계정으로 Fork
2. Fork한 내 저장소에서 **Code → Codespaces → Create codespace on main**
3. 브라우저에 VS Code 화면이 열리면 준비 끝입니다. 이번 주는 내 컴퓨터로 Clone하지 않습니다.
4. Copilot이 로그인된 상태인지 확인합니다.

### 2단계 — `dev` 브랜치 생성 후 PRD 작성

1. `main`에서 `dev` 브랜치 생성 후 체크아웃
   ```bash
   git checkout -b dev
   ```
2. `PRD.md`를 열고 10개 항목을 직접 채웁니다. **이번 주에서 가장 시간을 많이 쓰는 단계입니다.**

작성 요령:

- **기능 요구사항**은 "사용자가 ~한다"처럼 동사로 적습니다.
- **상태 정의**는 상태마다 "화면에 무엇이 보이는지"까지 적습니다. (예: "완료된 항목은 취소선 + 흐린 글씨")
- **예외 처리**는 일부러 이상하게 써보는 사람을 떠올리며 적습니다. HTML 태그 입력 항목은 13주차 보안 실습과도 이어지니 꼭 답을 적어두세요.
- **완료 기준**은 "예/아니오로 확인 가능한 문장"으로 적습니다. 4단계에서 두 버전을 채점하는 기준이 됩니다.
- **CSS 프레임워크 이름은 PRD에 쓰지 않습니다.** 브랜치마다 다르게 지정할 것이기 때문입니다.

### 3단계 — AI에게 PRD 검토받기 (`dev` 브랜치)

코드를 만들기 전에, **PRD 자체를 AI에게 먼저 검토**받습니다.

1. Copilot Chat을 **Ask 모드**로 열고, `PRD.md`를 첨부해 검토를 요청합니다 (프롬프트 예시 참고)
2. AI가 지적한 빠진 부분, 모호한 부분 중 **받아들일 것만 골라** `PRD.md`에 직접 반영합니다. 전부 받아들일 필요는 없습니다.
3. 완성된 PRD를 `dev`에 커밋합니다.
   ```bash
   git add PRD.md
   git commit -m "To-Do 리스트 PRD 작성"
   ```

```
[Copilot Chat — Ask 모드 — PRD 검토]
첨부한 PRD.md는 To-Do 리스트를 만들기 위한 요구사항 문서야.
아직 코드는 만들지 마.
이 PRD로 개발자가 바로 구현할 수 있을지 검토해서,
1) 빠진 상태나 기능
2) 모호해서 사람마다 다르게 구현할 수 있는 부분
3) 완료 기준으로 확인하기 어려운 문장
을 각각 목록으로 알려줘.
```

**[체크포인트]** AI 검토 후 PRD에서 바뀐 부분을 2가지 이상 적어보세요. 왜 처음엔 그걸 놓쳤을까요?

### 4단계 — `dev`에서 `bootstrap` 브랜치 생성 후 구현

1. `dev`에서 `bootstrap` 브랜치 생성 후 체크아웃
   ```bash
   git checkout -b bootstrap
   ```
2. Copilot Chat을 **Plan 모드**로 바꾸고, `PRD.md`를 첨부해 구현 계획을 요청합니다
3. 계획이 **PRD의 완료 기준을 빠짐없이 반영했는지** 확인 — 빠진 게 있으면 보완 요청
4. 만족스러우면 **Implement plan**으로 Agent에게 구현을 맡깁니다
5. 실행해서 확인합니다 (아래 "Codespaces에서 화면 보기" 참고)
6. 커밋 (아직 어디에도 merge하지 않습니다 — 6단계에서 `tailwind`와 비교할 대상으로 남겨둡니다)
   ```bash
   git add .
   git commit -m "Bootstrap 버전 구현"
   ```

```
[Copilot Chat — Plan 모드 — Bootstrap 버전]
첨부한 PRD.md를 바탕으로 To-Do 리스트를 구현하려고 해.
CSS 프레임워크는 Bootstrap 5를 CDN으로 불러와서 사용해줘.
PRD의 "완료 기준"을 하나도 빠짐없이 반영한 구현 계획부터 세워줘.
```

```
[Copilot Chat — 계획 보완 예시]
계획에 PRD 5번 "예외 처리"의 HTML 태그 입력 처리가 빠진 것 같아. 추가해서 다시 세워줘.
```

### 5단계 — `dev`에서 `tailwind` 브랜치 생성 후 구현

1. **`dev`로 이동** (아직 `bootstrap`의 코드가 없는, PRD만 있는 상태입니다)
2. `dev`에서 `tailwind` 브랜치 생성 후 체크아웃
   ```bash
   git checkout dev
   git checkout -b tailwind
   ```
3. **새 Copilot Chat**을 열고(이전 대화가 섞이지 않게), 4단계와 같은 방법으로 진행 — 프롬프트에서 **프레임워크 이름만** 바꿉니다
4. 실행해서 확인하고 커밋
   ```bash
   git add .
   git commit -m "Tailwind 버전 구현"
   ```

```
[Copilot Chat — Plan 모드 — Tailwind 버전]
첨부한 PRD.md를 바탕으로 To-Do 리스트를 구현하려고 해.
CSS 프레임워크는 Tailwind CSS를 CDN으로 불러와서 사용해줘.
PRD의 "완료 기준"을 하나도 빠짐없이 반영한 구현 계획부터 세워줘.
```

> 💡 두 프레임워크 모두 **CDN**(인터넷 주소로 불러오기)으로 쓰기 때문에 설치나 빌드 없이 GitHub Pages에 바로 배포할 수 있습니다. 단, Tailwind CDN은 공식적으로 개발·학습용입니다. 실제 서비스에서는 빌드 과정을 거쳐 필요한 스타일만 담은 CSS 파일을 만들어 씁니다.

### 6단계 — 두 버전 비교 후 나은 쪽을 `dev`로 merge

1. PRD의 **완료 기준**을 채점표로 써서 두 버전을 비교합니다. 브랜치를 바꿔가며(`git checkout bootstrap` / `git checkout tailwind`) 화면을 새로고침해 확인하세요.

   | 비교 항목 | `bootstrap` | `tailwind` |
   |---|:---:|:---:|
   | 완료 기준 충족 개수 (예: 8개 중 몇 개) | | |
   | 예외 처리 (빈 입력, 긴 문장, HTML 태그) | | |
   | 모바일 화면 (브라우저 개발자 도구로 확인) | | |
   | 디자인 완성도 (내 판단) | | |
   | `index.html`의 class 모양 | | |

2. **[체크포인트]** 두 버전의 `index.html`에서 버튼 하나의 `class`를 찾아 나란히 적어보세요. 어떤 차이가 보이나요?
3. 더 나은 쪽을 `dev`로 merge — 아래는 `tailwind`를 골랐을 때의 예시입니다
   ```bash
   git checkout dev
   git merge tailwind
   ```

> 💡 선택하지 않은 브랜치는 merge하지 않고, 삭제하지도 않습니다. 비교 기록으로 남겨둡니다.

### 7단계 — `dev`에서 보완 작업

merge한 버전을 `dev`에서 직접 다듬어 완성도를 높입니다. Copilot **Agent 모드**를 써도 좋습니다.

- 채점표에서 **충족하지 못한 완료 기준**이 있다면 먼저 채웁니다
- 선택하지 않은 버전에서 **더 좋았던 부분**이 있다면 가져와 반영합니다 (예: "bootstrap 버전처럼 빈 상태 안내에 아이콘을 넣어줘")
- 커스터마이징 범위 가이드(아래)에서 원하는 것을 골라 추가합니다

보완할 때마다 커밋합니다.

```bash
git add .
git commit -m "보완: (무엇을 고쳤는지)"
```

**[체크포인트]** 보완 작업 중 PRD에 없던 것을 추가했다면, `PRD.md`에도 한 줄 반영해두세요. 문서와 결과물이 어긋나지 않게 유지하는 것도 PRD 관리의 일부입니다.

### 8단계 — `dev`에서 README.md 작성

저장소의 `README.md`는 지금 뼈대(섹션 제목)만 있습니다. `dev`에서 직접 채워 넣고 커밋합니다.

- **"Bootstrap vs Tailwind"** 섹션에 6단계 비교 결과와 선택 이유
- **"커스터마이징한 부분"** 섹션에 7단계 보완 내용
- **"실행 방법"**에는 배포 주소를 미리 적어둡니다 — `https://내GitHub아이디.github.io/26-w08-todo/` 형식입니다

```bash
git add README.md
git commit -m "README 작성"
```

### 9단계 — `gh-pages`로 merge 후 GitHub Pages 배포

1. 완성된 `dev`에서 `gh-pages` 브랜치를 만들고 올립니다
   ```bash
   git checkout -b gh-pages
   git push origin gh-pages
   ```
2. 내 저장소의 **Settings → Pages**에서 브랜치를 `gh-pages`, 폴더를 `/ (root)`로 지정
3. 1~2분 뒤 배포 주소로 접속해 확인
4. 나머지 브랜치도 모두 올려둡니다
   ```bash
   git push origin dev bootstrap tailwind
   ```

> 💡 배포 후 `dev`에서 다시 수정했다면, `gh-pages`로 merge해서 올리면 배포에 반영됩니다.
> ```bash
> git checkout gh-pages
> git merge dev
> git push origin gh-pages
> ```

### 10단계 — 태그, PR 제출

1. `dev`에 태그를 붙이고 GitHub에서 Release Note를 작성합니다
   ```bash
   git checkout dev
   git tag v1.0
   git push origin v1.0
   ```
2. 내 저장소의 **`dev`** → 원본 저장소(`kopo-kangseo-cybersec/26-w08-todo`)의 **`main`** 방향으로 Pull Request를 생성하고, PR 템플릿을 채워 제출하세요.

### 11단계 — Codespace 정지

작업이 끝나면 **github.com/codespaces**에서 내 Codespace를 **Stop**합니다. 켜두면 무료 사용 시간이 계속 줄어듭니다. 다음에 이어서 할 때는 새로 만들지 말고 같은 Codespace를 다시 열면 됩니다.

---

## Codespaces에서 화면 보기

Codespaces는 클라우드 컴퓨터라서 파일을 더블클릭해 브라우저로 열 수 없습니다. 대신 작은 웹 서버를 띄웁니다.

1. 터미널에서 실행
   ```bash
   python3 -m http.server 8000
   ```
2. 오른쪽 아래 알림에서 **Open in Browser** 클릭 (알림을 놓쳤다면 하단 **PORTS** 탭 → 8000번 → 지구본 아이콘)
3. 브랜치를 바꾸면 파일이 바뀌니 **새로고침**만 하면 됩니다. 서버는 계속 켜두어도 됩니다.
4. 서버를 끄려면 터미널에서 `Ctrl + C`

## 이해 단계 체크포인트

- [ ] 좋은 PRD와 부족한 PRD의 차이를, 내가 AI 검토로 보완한 부분을 예로 들어 설명할 수 있다
- [ ] 상태(state)를 명시적으로 정의하는 것이 화면 구성에 어떤 영향을 주는지 설명할 수 있다
- [ ] Bootstrap과 Tailwind가 디자인을 입히는 방식의 차이를 한 문장으로 설명할 수 있다 (힌트: 완성된 부품 vs 작은 스타일 조각)
- [ ] 할 일에 HTML 태그를 입력했을 때 내 앱이 어떻게 동작하는지, 그 이유가 코드의 어느 부분 때문인지 말할 수 있다
- [ ] `main`을 보존하고 `dev`를 통해 통합하는 브랜치 전략의 목적을 설명할 수 있다

## 커스터마이징 범위 가이드

자유: 색상, 폰트, 레이아웃, 할 일 카테고리/태그
선택 도전: 검색 기능, 할 일 내용 수정 — 시간 남는 학생 대상
필수 포함: 할 일 추가·삭제·완료 토글, 마감 날짜/시간 선택, 우선순위 설정, 필터(전체/진행 중/완료), 진행률, 빈 상태 안내, localStorage 저장, 빈 입력 방지

## 막혔을 때

- **Codespace가 안 열린다 / 느리다** → github.com/codespaces에서 기존 Codespace를 다시 엽니다. 새로 만들지 말고 기존 것을 이어 쓰세요.
- **브랜치 전환 시 변경사항을 잃어버렸다** → merge 전에는 커밋을 꼭 해두세요. `git status`로 현재 브랜치와 변경사항을 항상 확인하는 습관을 들이세요.
- **`tailwind` 브랜치에 Bootstrap 코드가 들어 있다** → `bootstrap`에서 브랜치를 만든 경우입니다. `git checkout dev` 후 `git branch -D tailwind`로 지우고 다시 만드세요.
- **`bootstrap`과 `tailwind` 중 뭘 merge할지 헷갈린다** → 채점표에서 완료 기준을 더 많이 충족한 쪽을 고르면 됩니다. 애매하면 두 화면을 캡처해서 나란히 놓고 비교하세요.
- **화면에 디자인이 하나도 적용되지 않는다** → `index.html`에 프레임워크 CDN 주소(`<link>` 또는 `<script>`)가 들어 있는지 확인하세요.
- **GitHub Pages 배포 후 화면이 안 뜬다** → Settings → Pages에서 배포 브랜치가 `gh-pages`, 폴더가 `/ (root)`인지, `index.html`이 저장소 맨 위에 있는지 확인하세요.
