import { useState } from "react";
import { supabase } from "../services/supabase";

const SPORTS = [
  "Football",
  "Basketball",
  "Tennis",
  "Running",
  "Cycling",
  "Volleyball",
  "Swimming",
  "Padel",
];
const LEVELS = ["Beginner", "Intermediate", "Advanced"];
const GENDERS = ["Male", "Female", "Other"];

export default function Informations() {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState("");
  const [description, setDescription] = useState("");
  const [age, setAge] = useState("");
  const [city, setCity] = useState("");
  const [gender, setGender] = useState("");
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [skillLevel, setSkillLevel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleSport = (sport: string) => {
    setSelectedSports((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport],
    );
  };

  const handleSubmit = async () => {
    if (selectedSports.length === 0 || !skillLevel) {
      setError("Please select at least one sport and a skill level.");
      return;
    }
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase.from("profiles").upsert({
      id: user?.id,
      username,
      description,
      age: age ? parseInt(age) : null,
      city,
      gender,
      sports: selectedSports,
      skill_level: skillLevel,
      available_today: false,
    });
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0f1419] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
            <span className="text-white text-2xl">🏃</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-100">Your profile</h1>
          <p className="text-sm text-gray-400 mt-1">Step {step} of 2</p>
          <div className="flex gap-2 justify-center mt-3">
            <div
              className={`h-1 w-16 rounded-full ${step >= 1 ? "bg-emerald-500" : "bg-[#2a3038]"}`}
            />
            <div
              className={`h-1 w-16 rounded-full ${step >= 2 ? "bg-emerald-500" : "bg-[#2a3038]"}`}
            />
          </div>
        </div>

        <div className="bg-[#1a1f26] rounded-2xl border border-[#2a3038] p-7 shadow-lg shadow-black/20 space-y-5">
          {step === 1 && (
            <>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">
                  Username <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. victor_runs"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-[#0f1419] text-gray-100 border border-[#2a3038] rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">
                  Short bio <span className="text-gray-500">(optional)</span>
                </label>
                <textarea
                  placeholder="e.g. Love playing football on weekends..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 text-sm bg-[#0f1419] text-gray-100 border border-[#2a3038] rounded-lg focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm text-gray-400 mb-1.5">
                    Age
                  </label>
                  <input
                    type="number"
                    placeholder="25"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-[#0f1419] text-gray-100 border border-[#2a3038] rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-gray-400 mb-1.5">
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="Timișoara"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-[#0f1419] text-gray-100 border border-[#2a3038] rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-3">
                  Gender
                </label>
                <div className="flex gap-3">
                  {GENDERS.map((g) => (
                    <button
                      key={g}
                      onClick={() => setGender(g)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                        gender === g
                          ? "bg-emerald-500 text-white border-emerald-500"
                          : "bg-[#0f1419] text-gray-400 border-[#2a3038] hover:border-emerald-500/50"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  if (!username) {
                    setError("Username is required.");
                    return;
                  }
                  setError("");
                  setStep(2);
                }}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors mt-2"
              >
                Continue →
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="block text-sm text-gray-400 mb-3">
                  Preferred sports <span className="text-red-400">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {SPORTS.map((sport) => (
                    <button
                      key={sport}
                      onClick={() => toggleSport(sport)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                        selectedSports.includes(sport)
                          ? "bg-emerald-500 text-white border-emerald-500"
                          : "bg-[#0f1419] text-gray-400 border-[#2a3038] hover:border-emerald-500/50"
                      }`}
                    >
                      {sport}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-3">
                  Skill level <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-3">
                  {LEVELS.map((level) => (
                    <button
                      key={level}
                      onClick={() => setSkillLevel(level)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                        skillLevel === level
                          ? "bg-emerald-500 text-white border-emerald-500"
                          : "bg-[#0f1419] text-gray-400 border-[#2a3038] hover:border-emerald-500/50"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-400/10 p-2 rounded border border-red-400/20">
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-2.5 bg-[#0f1419] text-gray-300 border border-[#2a3038] hover:bg-[#2a3038] text-sm font-medium rounded-lg transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Finish"}
                </button>
              </div>
            </>
          )}

          {step === 1 && error && (
            <p className="text-sm text-red-400 bg-red-400/10 p-2 rounded border border-red-400/20">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
