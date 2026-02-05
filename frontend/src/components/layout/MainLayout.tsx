import { AppShell as MantineAppShell } from "@mantine/core";
import { ReactNode } from "react";
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
  return (
    <>
      <Header />
      <MantineAppShell
        navbar={{
          width: 250,
          breakpoint: "sm",
        }}
      >
        <MantineAppShell.Navbar>
          <Sidebar activePage={activePage} onNavigate={onNavigate} />
        </MantineAppShell.Navbar>

        <MantineAppShell.Main>
          <div style={{ padding: "2rem" }}>{children}</div>
        </MantineAppShell.Main>
      </MantineAppShell>
    </>
  );
}
