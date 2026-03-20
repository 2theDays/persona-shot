export const STYLE_PRESETS = [
  {
    id: 'resume',
    name: '이력서용',
    label: 'Resume/CV',
    prompt: "Maintain the person's face exactly. Change the background to a professional, neutral solid light grey studio background. Change the person's outfit to a high-end formal business suit with a white shirt and a professional tie (if applicable) or a sophisticated blazer. The overall look should be sharp, professional, and suitable for a corporate job application.",
    icon: 'FileText',
    exampleText: "전문적인 정장과 깔끔한 스튜디오 배경"
  },
  {
    id: 'passport',
    name: '여권/증명사진',
    label: 'Passport',
    prompt: "REPLACE THE ENTIRE BACKGROUND with a pure, solid, flat WHITE background (#FFFFFF) with NO shadows. This is for an official passport photo. Maintain the person's face exactly, but adjust the image to follow these international passport standards: 1. Neutral expression, eyes looking directly at camera. 2. Clear visibility of both ears if possible. 3. Remove any hats, sunglasses, or large accessories. 4. Change the outfit to a formal dark-colored business attire (suit/blazer) to contrast with the white background. 5. Lighting must be even and bright across the face. THE BACKGROUND MUST BE 100% WHITE.",
    icon: 'UserSquare',
    exampleText: "규격 준수 하얀색 배경, 정면 응시, 귀 노출 및 정장"
  },
  {
    id: 'profile',
    name: '전문 프로필',
    label: 'Professional',
    prompt: "Maintain the person's face exactly. Background: A sleek, modern IT startup office with glass walls, minimalist furniture, and warm cinematic lighting. Outfit: Sophisticated business casual style, a clean tailored blazer over a stylish knit or shirt. Atmosphere: High-quality, professional photography, 8k resolution.",
    icon: 'Briefcase',
    exampleText: "세련된 IT 스타트업 사무실 배경과 비즈니스 캐주얼"
  },
  {
    id: 'instagram',
    name: '인스타 감성',
    label: 'Instagram',
    prompt: "Maintain the person's face exactly. Background: A trendy, aesthetic cafe in Seoul or a minimalist designer showroom with natural soft lighting and plants. Outfit: Fashionable contemporary street style or 'Quiet Luxury' look. Atmosphere: High-end lifestyle photography, vibrant but natural colors, film-like grain, bokeh effect.",
    icon: 'Instagram',
    exampleText: "감성적인 카페 배경과 트렌디한 데일리룩"
  }
];
