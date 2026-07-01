import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";

export default function AdminRegister() {
  const { register } = useAdminAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Password and confirmation do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await register({ username: username.trim(), password, confirm_password: confirmPassword });
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-portal-bg px-6">
      <div className="w-full max-w-sm bg-white border border-gray-200 rounded-lg shadow-sm p-7">
        <div className="text-center mb-6">
          <img src="/logo.png" alt="University emblem" className="w-14 h-14 mx-auto mb-2" />
          <h1 className="text-portal-navy font-bold text-lg">Admin Registration</h1>
          <p className="text-sm text-gray-500">Create a new dashboard account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-portal-navy mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              required
              minLength={3}
              placeholder="e.g. exam_cell_admin"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-portal-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-portal-navy mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-portal-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-portal-navy mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-portal-accent"
            />
          </div>

          {error && (
            <p className="text-portal-fail text-sm bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-portal-blue hover:bg-portal-navy text-white font-semibold px-6 py-2.5 rounded transition-colors disabled:opacity-60"
          >
            {submitting ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="text-sm text-gray-500 mt-5 text-center">
          Already have an account?{" "}
          <Link to="/admin/login" className="text-portal-blue font-semibold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
