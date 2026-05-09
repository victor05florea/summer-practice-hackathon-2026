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
    <div className="min-h-screen bg-[#0f1419] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
            <span className="text-white text-2xl">🏃</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-100">ShowUp2Move</h1>
          <p className="text-sm text-gray-400 mt-1">
            Show up today. Show up to move.
          </p>
        </div>

        <div className="bg-[#1a1f26] rounded-2xl border border-[#2a3038] p-7 shadow-lg shadow-black/20">
          <div className="flex bg-[#0f1419] rounded-lg p-1 mb-6 border border-[#2a3038]">
            <button
              onClick={() => setTab("login")}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                tab === "login"
                  ? "bg-[#2a3038] text-white shadow-sm"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Sign in
            </button>
            <button
              onClick={() => setTab("register")}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                tab === "register"
                  ? "bg-[#2a3038] text-white shadow-sm"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Create account
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-[#0f1419] text-gray-100 border border-[#2a3038] rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-sm text-gray-400">Password</label>
                {tab === "login" && (
                  <span className="text-sm text-emerald-500 cursor-pointer hover:text-emerald-400 transition-colors">
                    Forgot password?
                  </span>
                )}
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-[#0f1419] text-gray-100 border border-[#2a3038] rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-400/10 p-2 rounded border border-red-400/20">
                {error}
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 mt-2"
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
              className="text-emerald-500 cursor-pointer hover:text-emerald-400 transition-colors"
            >
              {tab === "login" ? "Create one" : "Sign in"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
