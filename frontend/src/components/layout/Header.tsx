import { Box } from '@mantine/core';
import { useThemeStore } from '../../theme/useThemeStore';
import { getTheme } from '../../theme/themes';

export function Header() {
  const themeId = useThemeStore((s) => s.themeId);
  const appTheme = getTheme(themeId);

  return (
    <Box
      style={{
        background: appTheme.headerGradient,
        height: 16,
      }}
    />
  );
}
