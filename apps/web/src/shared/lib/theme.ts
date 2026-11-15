// 화면 테마(라이트·다크). 기본은 시스템 설정을 따르고, 테마 버튼으로 고르면 html[data-theme]와 localStorage에 남긴다
export type Theme = "light" | "dark";

export const THEME_KEY = "keepio.theme";

// 첫 그리기 전에 저장된 테마를 적용해 깜빡임을 막는다(app/layout.tsx head에서 실행)
export const THEME_BOOT_SCRIPT = `try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export function currentTheme(): Theme {
  const chosen = document.documentElement.dataset.theme;
  if (chosen === "light" || chosen === "dark") return chosen;
  // matchMedia가 없는 환경(테스트 등)은 라이트로 본다
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    // 저장소를 못 쓰는 환경(사생활 보호 모드 등)이면 이번 방문에만 적용
  }
}
