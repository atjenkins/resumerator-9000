import { Tooltip } from "@mantine/core";

const KOFI_USERNAME = import.meta.env.VITE_KOFI_USERNAME;

interface KofiButtonProps {
  variant: "icon" | "badge" | "banner";
  tooltip?: boolean;
}

/**
 * Ko-fi support button component
 * Shows Ko-fi button/badge/icon linking to the configured Ko-fi page
 * Returns null if VITE_KOFI_USERNAME is not configured
 */
export function KofiButton({ variant, tooltip = true }: KofiButtonProps) {
  if (!KOFI_USERNAME || typeof KOFI_USERNAME !== "string") {
    return null;
  }

  const url = `https://ko-fi.com/${KOFI_USERNAME}`;

  const images = {
    icon: { src: "/kofi/cup.png", width: 24, alt: "Ko-fi cup" },
    badge: { src: "/kofi/badge_blue.png", width: 150, alt: "Support me on Ko-fi" },
    banner: { src: "/kofi/button_blue.png", width: 200, alt: "Support me on Ko-fi" },
  };

  const img = images[variant];

  const link = (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "inline-flex",
        textDecoration: "none",
        transition: "opacity 0.2s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
    >
      <img
        src={img.src}
        alt={img.alt}
        width={img.width}
        style={{ display: "block" }}
      />
    </a>
  );

  if (tooltip && variant === "icon") {
    return (
      <Tooltip label="Support on Ko-fi" position="right">
        {link}
      </Tooltip>
    );
  }

  return link;
}
