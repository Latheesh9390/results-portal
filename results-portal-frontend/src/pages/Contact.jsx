import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Contact() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-10">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-bold text-portal-navy mb-3">Contact Us</h2>
          <p className="text-sm text-gray-600 mb-4">
            For queries regarding your examination result, please reach out to the Controller of
            Examinations office.
          </p>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>
              <span className="font-semibold">Address:</span> JNTUA, Ananthapuramu, Andhra
              Pradesh, India - 515002
            </li>
            <li>
              <span className="font-semibold">Email:</span> results@jntua.example.in
            </li>
            <li>
              <span className="font-semibold">Phone:</span> +91-00000-00000
            </li>
          </ul>
        </div>
      </main>
      <Footer />
    </div>
  );
}
