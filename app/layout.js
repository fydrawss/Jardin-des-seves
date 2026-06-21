import "./globals.css";

export const metadata = {
  title: "Jardin Des Sèves",
  description: "Analyse de bouquets floraux — identifie les fleurs, leur nombre, et les étapes pour les reproduire.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
