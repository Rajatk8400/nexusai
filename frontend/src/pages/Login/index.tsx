import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { authApi, ApiError } from "../../services/api";
import Alert from "../../components/ui/Alert";
import { SparkleIcon } from "../../components/ui/Icons";

type Mode = "login" | "register" | "forgot";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Login fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Forgot / Reset Password fields
  const [forgotEmail, setForgotEmail] = useState("");
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Register fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [gstNumber, setGstNumber] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setMode("login");
    setEmail("demo@nexusai.com");
    setPassword("demo1234");
    setLoading(true);
    setError(null);
    try {
      await login("demo@nexusai.com", "demo1234");
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Demo login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmailForReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await authApi.forgotPassword(forgotEmail);
      setIsEmailVerified(true);
      setSuccessMsg("Account verified! Please enter your new password below.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Account verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await authApi.resetPassword(forgotEmail, newPassword);
      setSuccessMsg("Password updated successfully! You can now sign in.");
      setEmail(forgotEmail);
      setPassword(newPassword);
      setTimeout(() => {
        setMode("login");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await register({
        firstName, lastName, email: regEmail, password: regPassword,
        businessName,
      });
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-blue-500/30">
            <SparkleIcon size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">NexusAI</h1>
          <p className="text-slate-400 text-sm mt-1">B2B AI Platform for MSMEs</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">

          {/* Demo Account Credentials Banner */}
          {mode !== "forgot" && (
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-950/60 via-indigo-950/60 to-slate-900/80 border border-blue-500/40 rounded-xl shadow-inner">
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 uppercase tracking-wider">
                  <SparkleIcon size={14} className="text-blue-400 animate-pulse" /> Demo Credentials
                </span>
                <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30">
                  No Registration Needed
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950/80 p-2.5 rounded-lg border border-slate-700/60 mb-3">
                <div>
                  <span className="text-slate-400 block text-[10px]">User ID (Email):</span>
                  <span className="text-emerald-400 font-bold select-all">demo@nexusai.com</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Password:</span>
                  <span className="text-emerald-400 font-bold select-all">demo1234</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/50 disabled:opacity-60"
              >
                <span>⚡ One-Click Demo Login</span>
              </button>
            </div>
          )}

          {/* Mode toggle */}
          {mode !== "forgot" && (
            <div className="flex bg-slate-900/60 rounded-xl p-1 mb-6">
              {(["login", "register"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(null); setSuccessMsg(null); }}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                    mode === m
                      ? "bg-blue-600 text-white shadow-lg"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {m === "login" ? "Sign In" : "Create Account"}
                </button>
              ))}
            </div>
          )}

          {error && (
            <Alert type="danger" message={error} onClose={() => setError(null)} className="mb-5" />
          )}

          {successMsg && (
            <Alert type="success" message={successMsg} onClose={() => setSuccessMsg(null)} className="mb-5" />
          )}

          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  required placeholder="you@company.com"
                  className="w-full bg-slate-900/60 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-medium text-slate-300">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot");
                      setForgotEmail(email);
                      setIsEmailVerified(false);
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                <input
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  required placeholder="••••••••"
                  className="w-full bg-slate-900/60 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                />
              </div>
              <button
                type="submit" disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:from-blue-500 hover:to-blue-600 transition-all shadow-lg shadow-blue-900/40 disabled:opacity-60 text-sm mt-2"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          ) : mode === "forgot" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-3 mb-2">
                <h2 className="text-lg font-bold text-white">Reset Password</h2>
                <button
                  type="button"
                  onClick={() => { setMode("login"); setError(null); setSuccessMsg(null); }}
                  className="text-xs text-slate-400 hover:text-white transition-colors"
                >
                  ← Back to Sign In
                </button>
              </div>

              {!isEmailVerified ? (
                <form onSubmit={handleVerifyEmailForReset} className="space-y-4">
                  <p className="text-xs text-slate-400">
                    Enter the email address associated with your account to reset your password.
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Registered Email</label>
                    <input
                      type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)}
                      required placeholder="you@company.com"
                      className="w-full bg-slate-900/60 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <button
                    type="submit" disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-900/40 disabled:opacity-60 text-sm"
                  >
                    {loading ? "Verifying Email..." : "Verify Account"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <p className="text-xs text-emerald-400 font-medium">
                    Account verified for: <span className="font-bold underline">{forgotEmail}</span>
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">New Password</label>
                    <input
                      type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                      required placeholder="Min 6 characters"
                      className="w-full bg-slate-900/60 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirm New Password</label>
                    <input
                      type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                      required placeholder="Confirm new password"
                      className="w-full bg-slate-900/60 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <button
                    type="submit" disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold rounded-xl hover:from-emerald-500 hover:to-emerald-600 transition-all shadow-lg shadow-emerald-900/40 disabled:opacity-60 text-sm"
                  >
                    {loading ? "Updating Password..." : "Create New Password"}
                  </button>
                </form>
              )}
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">First Name</label>
                  <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required placeholder="Aryan"
                    className="w-full bg-slate-900/60 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Last Name</label>
                  <input value={lastName} onChange={(e) => setLastName(e.target.value)} required placeholder="Mehta"
                    className="w-full bg-slate-900/60 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Business Name</label>
                <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} required placeholder="Nexus Retail Co."
                  className="w-full bg-slate-900/60 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Work Email</label>
                <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required placeholder="you@company.com"
                  className="w-full bg-slate-900/60 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Phone</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91-9876543210"
                    className="w-full bg-slate-900/60 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">GST No. <span className="text-slate-500">(optional)</span></label>
                  <input value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} placeholder="29ABCDE1234F1Z5"
                    className="w-full bg-slate-900/60 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                <input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required
                  placeholder="Min 8 chars, uppercase + number"
                  className="w-full bg-slate-900/60 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold rounded-xl hover:from-emerald-500 hover:to-emerald-600 transition-all shadow-lg shadow-emerald-900/40 disabled:opacity-60 text-sm mt-2">
                {loading ? "Creating account..." : "Start Free 14-Day Trial"}
              </button>
            </form>
          )}

          <p className="text-center text-xs text-slate-500 mt-4">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
