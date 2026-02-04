import { MantineColorsTuple, createTheme } from '@mantine/core';

const purple: MantineColorsTuple = [
  '#f3f0ff',
  '#e5dbff',
  '#d0bfff',
  '#b197fc',
  '#9775fa',
  '#845ef7',
  '#7950f2',
  '#7048e8',
  '#6741d9',
  '#5f3dc4',
];

export const theme = createTheme({
  primaryColor: 'purple',
  colors: {
    purple,
  },
  defaultRadius: 'md',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif',
});
