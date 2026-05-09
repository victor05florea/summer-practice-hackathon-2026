import { useState } from "react";
import { supabase } from "../services/supabase";

export default function Login() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    if (tab === "register") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setError(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">🏃</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">ShowUp2Move</h1>
          <p className="text-sm text-gray-500 mt-1">
            Find your people. Show up. Play.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-7 shadow-sm">
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
            <button
              onClick={() => setTab("login")}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                tab === "login"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Sign in
            </button>
            <button
              onClick={() => setTab("register")}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                tab === "register"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Create account
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1.5">
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-sm text-gray-500">Password</label>
                {tab === "login" && (
                  <span className="text-sm text-emerald-600 cursor-pointer hover:text-emerald-700">
                    Forgot password?
                  </span>
                )}
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 mt-1"
            >
              {loading
                ? "Loading..."
                : tab === "login"
                  ? "Sign in"
                  : "Create account"}
            </button>
          </div>

          <p className="text-center text-sm text-gray-400 mt-5">
            {tab === "login"
              ? "Don't have an account? "
              : "Already have an account? "}
            <span
              onClick={() => setTab(tab === "login" ? "register" : "login")}
              className="text-emerald-600 cursor-pointer hover:text-emerald-700"
            >
              {tab === "login" ? "Create one" : "Sign in"}
            </span>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          By continuing, you agree to our Terms & Privacy Policy
        </p>
      </div>
    </div>
  );
}
