import { AppShell as MantineAppShell } from "@mantine/core";
import { ReactNode, useState } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

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

  return (
    <>
      <Header />
      <MantineAppShell
        navbar={{
          width: sidebarWidth,
          breakpoint: "sm",
        }}
      >
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

        <MantineAppShell.Main
          style={{
            transition: "padding-left 0.4s ease-in-out",
          }}
        >
          <div style={{ padding: "2rem" }}>{children}</div>
        </MantineAppShell.Main>
      </MantineAppShell>
    </>
  );
}
