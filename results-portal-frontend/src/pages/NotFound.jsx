import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <svg
          className="w-16 h-16 text-gray-300 mb-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="M21 21l-5.2-5.2" strokeLinecap="round" />
        </svg>
        <h2 className="text-xl font-bold text-portal-navy mb-1">No Result Found</h2>
        <p className="text-gray-500 mb-6">The result is not published or does not exist.</p>
        <button
          onClick={() => navigate("/")}
          className="bg-portal-blue hover:bg-portal-navy text-white font-semibold px-6 py-2.5 rounded transition-colors"
        >
          Go Home
        </button>
      </main>

      <Footer />
    </div>
  );
}
