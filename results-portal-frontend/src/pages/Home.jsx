import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Loader from "../components/Loader";
import { searchResult } from "../api/resultApi";

export default function Home() {
  const navigate = useNavigate();

  const [examType, setExamType] = useState("regular");
  const [hallticket, setHallticket] = useState("");

  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!hallticket.trim()) {
      setError("Please enter your Hall Ticket Number.");
      return;
    }

    setSearching(true);
    try {
      const memo = await searchResult({
        hallticket: hallticket.trim(),
        examType,
      });
      navigate("/result", { state: { memo } });
    } catch (err) {
      if (err.status === 404) {
        navigate("/not-found");
        return;
      }
      setError(err.message);
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-8">
        {searching ? (
          <Loader />
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block font-semibold text-portal-navy mb-2">Examination</label>
                <div className="flex gap-6">
                  {["regular", "supplementary"].map((type) => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="examType"
                        value={type}
                        checked={examType === type}
                        onChange={() => setExamType(type)}
                        className="accent-portal-blue w-4 h-4"
                      />
                      <span className="capitalize">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="hallticket" className="block font-semibold text-portal-navy mb-2">
                  Hall Ticket Number
                </label>
                <input
                  id="hallticket"
                  type="text"
                  value={hallticket}
                  onChange={(e) => setHallticket(e.target.value.toUpperCase())}
                  placeholder="Enter Hall Ticket Number"
                  maxLength={12}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-portal-accent uppercase"
                />
              </div>

              {error && (
                <p className="text-portal-fail text-sm bg-red-50 border border-red-200 rounded px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={searching}
                className="w-full sm:w-auto bg-portal-blue hover:bg-portal-navy text-white font-semibold px-6 py-2.5 rounded transition-colors disabled:opacity-60"
              >
                Search Result
              </button>
            </form>

            <div className="mt-6 bg-portal-bg border border-blue-100 rounded p-4 text-sm text-portal-navy">
              <p className="font-semibold mb-1">Note :</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Enter your Hall Ticket Number and Click on Search Result.</li>
                <li>For Supplementary Results, select Supplementary and enter Hall Ticket Number.</li>
              </ul>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
