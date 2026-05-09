import { useState } from "react";
import { supabase } from "../services/supabase";
import Button from "../components/Button";

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">🏃</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Your profile</h1>
          <p className="text-sm text-gray-500 mt-1">Step {step} of 2</p>
          <div className="flex gap-2 justify-center mt-3">
            <div
              className={`h-1 w-16 rounded-full ${step >= 1 ? "bg-emerald-500" : "bg-gray-200"}`}
            />
            <div
              className={`h-1 w-16 rounded-full ${step >= 2 ? "bg-emerald-500" : "bg-gray-200"}`}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-7 shadow-sm space-y-5">
          {step === 1 && (
            <>
              <div>
                <label className="block text-sm text-gray-500 mb-1.5">
                  Username <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. victor_runs"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-1.5">
                  Short bio <span className="text-gray-300">(optional)</span>
                </label>
                <textarea
                  placeholder="e.g. Love playing football on weekends..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm text-gray-500 mb-1.5">
                    Age
                  </label>
                  <input
                    type="number"
                    placeholder="25"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-gray-500 mb-1.5">
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="Cluj-Napoca"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-3">
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
                          : "bg-white text-gray-600 border-gray-200 hover:border-emerald-300"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                label="Continue →"
                onClick={() => {
                  if (!username) {
                    setError("Username is required.");
                    return;
                  }
                  setError("");
                  setStep(2);
                }}
                fullWidth
              />
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="block text-sm text-gray-500 mb-3">
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
                          : "bg-white text-gray-600 border-gray-200 hover:border-emerald-300"
                      }`}
                    >
                      {sport}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-3">
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
                          : "bg-white text-gray-600 border-gray-200 hover:border-emerald-300"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex gap-3">
                <Button
                  label="← Back"
                  variant="outline"
                  onClick={() => setStep(1)}
                />
                <Button
                  label={loading ? "Saving..." : "Finish"}
                  onClick={handleSubmit}
                  fullWidth
                  disabled={loading}
                />
              </div>
            </>
          )}

          {step === 1 && error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
