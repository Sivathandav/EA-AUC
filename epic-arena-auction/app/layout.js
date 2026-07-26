import './globals.css';

export const metadata = {
  title: 'EPIC ARENA PREMIER LEAGUE MEGA AUCTION',
  description: 'Live turf-tournament auction control room',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
