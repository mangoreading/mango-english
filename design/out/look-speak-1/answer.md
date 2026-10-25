아래 zip에 실제 적용 가능한 HTML/CSS/JS와 분리된 디자인 요소(assets 폴더: 아이콘·배경·장식)가 포함되어 있습니다. 기준 해상도 1280×800, ‘16,000원입니다’ 박스는 내용에 맞춰 가로로 자동 확장됩니다.

다운로드: [look_speak_activity.zip](sandbox:/mnt/data/look_speak_activity.zip)

구성 설명
- index.html
  - 화면 구조(상단바, 진행도, 포인트 배지, 안내 문구, 가격 박스, 힌트/정답 카드, 마이크 버튼)
  - 배경은 CSS + 분리된 SVG(assets/bg-blob-left.svg, bg-blob-right.svg)로 레이어링
- styles.css
  - 카드, 버튼, 그림자, 색상 변수 정의
  - 가격 박스(.price-card/.price-text)
    - width: fit-content 성격으로 자동 확장
    - white-space: nowrap로 한 줄 유지, max-width로 화면 넘침 방지
- script.js
  - 스피커 버튼 클릭 시 WebAudio로 짧은 비프(데모용)
  - 마이크 버튼 클릭 시 MediaRecorder 시도(권한 허용 시 동작) + 녹음 상태 애니메이션
  - setPrice(numberText, suffixText) 제공: 동적으로 금액/문구 변경 가능
    - 예: setPrice('135,000', '원입니다.')

- assets/
  - chevron-left.svg: 뒤로가기 아이콘
  - star.svg: 포인트 배지용 별
  - speaker.svg: 듣기 아이콘
  - mic.svg: 마이크 심벌(버튼 배경은 CSS)
  - bulb.svg: 힌트 아이콘
  - spark-left.svg, spark-right.svg: 가격 박스 양옆 장식
  - bg-blob-left.svg, bg-blob-right.svg: 배경 구름/도트 블롭(배경과 요소 완전 분리)

사용 방법
1) zip을 풀고 로컬에서 index.html을 열면 시안과 유사한 화면이 렌더링됩니다.
2) 문구/금액을 바꾸려면 콘솔 또는 코드에서 setPrice('200,000', '원입니다.') 호출.
3) 폰트는 구글 폰트(Inter, Noto Sans KR)를 링크했으므로 온라인 환경에서 자동 로드됩니다. 오프라인 환경이면 시스템 폰트로 대체됩니다.

필요 시
- 실제 서비스 색/그림자/여백 수치 미세조정 가능
- 아이콘/배경 SVG는 벡터라 해상도 독립적으로 확장 가능
- 추가 상태(정답/오답, 진행도 변경 등)도 쉽게 확장 가능합니다.
