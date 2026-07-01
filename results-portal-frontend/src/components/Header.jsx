import { Link, useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b-4 border-portal-navy no-print">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
        <img src="/logo.png" alt="University emblem" className="w-16 h-16" />
        <div className="text-center flex-1">
          <h1 className="text-portal-navy text-xl md:text-2xl font-bold leading-tight">
            Jawaharlal Nehru Technological University Anantapur
          </h1>
          <p className="text-portal-blue text-sm">
            Ananthapuramu, Andhra Pradesh, India Pin : 515002
          </p>
          <h2 className="text-portal-navy text-base md:text-lg font-semibold mt-1">
            JNTUA Examination Results Portal
          </h2>
        </div>
      </div>
      <nav className="bg-portal-navy text-white">
        <div className="max-w-5xl mx-auto px-6 flex gap-6 text-sm">
          <button
            onClick={() => navigate("/")}
            className="py-2 px-1 hover:text-portal-accent transition-colors"
          >
            Home
          </button>
          <Link to="/contact" className="py-2 px-1 hover:text-portal-accent transition-colors">
            Contact Us
          </Link>
        </div>
      </nav>
    </header>
  );
}
