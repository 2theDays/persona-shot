# FaceFit: AI Profile Creator

FaceFit은 사용자의 사진을 분석하여 다양한 스타일의 프리미엄 프로필 이미지로 변환해주는 웹 애플리케이션입니다.

## 🚀 시작하기

1. **API 키 설정**:
   - `.env.example` 파일을 복사하여 `.env` 파일을 만듭니다.
   - [Google AI Studio](https://aistudio.google.com/)에서 Gemini API 키를 발급받아 `VITE_GEMINI_API_KEY`에 입력합니다.

2. **의존성 설치**:
   ```bash
   npm install
   ```

3. **개발 서버 실행**:
   ```bash
   npm run dev
   ```

## ✨ 주요 기능

- **AI 스타일 추천**: 비즈니스, 사이버펑크, 수채화, 자연 등 4가지 스타일 프리셋 제공.
- **실시간 비교**: 'HOLD FOR ORIGINAL' 버튼을 눌러 원본과 변환된 이미지를 비교해보세요.
- **프리미엄 UI**: Glassmorphism 디자인과 부드러운 애니메이션 적용.
- **이미지 다운로드**: 변환된 이미지를 손쉽게 저장할 수 있습니다.

## 🛠 기술 스택

- Vite + React
- Tailwind CSS (Premium Theme)
- Framer Motion (Animations)
- Lucide React (Icons)
- Gemini 2.0 Flash AI
