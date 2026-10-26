# ✅ 오늘의 할 일

과제와 일상 할 일을 기록하고, 마감일과 완료 상태를 관리하는 반응형 To-Do 앱입니다. 진행률, 필터, 브라우저 저장을 지원하며 할 일을 완료하면 축하 효과가 나타납니다.

## 어떻게 만들었나요

하나의 PRD를 기준으로 `bootstrap`과 `tailwind` 브랜치에 각각 앱을 구현했습니다. 완료 기준을 따라 할 일 추가·삭제·완료, 필터, 진행률, 입력 검증, 날짜, 저장과 팝업 동작을 확인했습니다.

## Bootstrap vs Tailwind

두 버전은 같은 기능과 화면 구성을 바탕으로 스타일을 적용했습니다.

- **Bootstrap**은 `btn`, `form-control`, `progress` 같은 준비된 컴포넌트 클래스를 사용합니다.
- **Tailwind**는 `rounded-xl`, `text-slate-500`, `md:grid-cols-7`처럼 작은 유틸리티 클래스를 조합해 각 요소의 스타일과 반응형 배치를 직접 지정합니다.

최종 버전으로 **Tailwind**를 선택했습니다. 화면 요소마다 스타일을 HTML에서 바로 확인하고 조정할 수 있고, 반응형 변경도 breakpoint 유틸리티로 표현할 수 있기 때문입니다. 비교한 버튼 클래스 예시는 Bootstrap의 `btn btn-primary btn-lg`와 Tailwind의 `h-12 w-full rounded-xl bg-indigo-600 ...`입니다.

## 실행 방법

저장소 루트에서 간단한 웹 서버를 실행합니다.

```bash
python3 -m http.server 8000
```

브라우저에서 `http://localhost:8000`으로 접속하세요. GitHub Pages 배포 주소는 [https://oska0706.github.io/todo/](https://oska0706.github.io/todo/)입니다.

## 커스터마이징한 부분

- 할 일마다 선택 마감일을 지정하고 목록에서 확인할 수 있습니다.
- 완료할 때 축하 문구와 꽃가루 효과를 보여줍니다.
- 삭제 전 확인 팝업에 슬픈 표정 아이콘을 표시하고, 취소·확정을 선택할 수 있습니다.
- 화면 크기에 따라 입력 폼과 목록이 반응형으로 배치됩니다.
