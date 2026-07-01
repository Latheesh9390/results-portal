export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-portal-navy text-white text-xs no-print">
      <div className="max-w-5xl mx-auto px-6 py-3 flex flex-col sm:flex-row justify-between gap-1">
        <span>© {year} JNTUA, Anantapuramu. All Rights Reserved.</span>
        <span>Designed &amp; Developed by JNTUA, Anantapuramu.</span>
      </div>
    </footer>
  );
}
