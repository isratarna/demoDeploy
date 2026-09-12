import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CI/CD Learning App",
  description: "Practice project for learning GitHub Actions CI/CD",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "sans-serif", margin: 0, padding: "2rem", background: "#f5f5f5" }}>
        {children}
      </body>
    </html>
  );
}
