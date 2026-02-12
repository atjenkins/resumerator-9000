import { AppShell as MantineAppShell } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { ReactNode, useState } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";

interface MainLayoutProps {
  children: ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
}

export function MainLayout({
  children,
  activePage,
  onNavigate,
}: MainLayoutProps) {
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <>
      {activePage !== "home" && <Header />}
      <MantineAppShell
        navbar={
          isMobile
            ? undefined
            : {
                width: sidebarWidth,
                breakpoint: "sm",
              }
        }
      >
        {!isMobile && (
          <MantineAppShell.Navbar
            style={{
              transition: "width 0.4s ease-in-out",
            }}
          >
            <Sidebar
              activePage={activePage}
              onNavigate={onNavigate}
              onWidthChange={setSidebarWidth}
            />
          </MantineAppShell.Navbar>
        )}

        <MantineAppShell.Main
          style={{
            transition: "padding-left 0.4s ease-in-out",
            paddingBottom: isMobile ? 60 : undefined,
          }}
        >
          <div style={{ padding: isMobile ? "0.75rem" : "2rem" }}>
            {children}
          </div>
        </MantineAppShell.Main>
      </MantineAppShell>

      {isMobile && <BottomNav activePage={activePage} onNavigate={onNavigate} />}
    </>
  );
}
