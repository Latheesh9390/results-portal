import { useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { changePassword } from "../../api/adminApi";

export default function AdminSettings() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setSaving(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout>
      <h2 className="text-xl font-bold text-portal-navy mb-6">Account Settings</h2>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 max-w-md">
        <h3 className="font-semibold text-portal-navy mb-4">Change Password</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="input"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="input"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="input"
            />
          </div>

          {error && (
            <p className="text-portal-fail text-sm bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </p>
          )}
          {success && (
            <p className="text-portal-pass text-sm bg-green-50 border border-green-200 rounded px-3 py-2">
              Password changed successfully.
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="bg-portal-blue hover:bg-portal-navy text-white font-semibold px-6 py-2.5 rounded transition-colors disabled:opacity-60"
          >
            {saving ? "Saving…" : "Update Password"}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
}
