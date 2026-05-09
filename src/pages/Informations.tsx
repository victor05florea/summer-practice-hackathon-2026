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
  "Yoga",
  "Hiking",
  "Gym",
  "Calisthenics",
];
const LEVELS = ["Beginner", "Intermediate", "Advanced"];

export default function Informations() {
  const [username, setUsername] = useState("");
  const [description, setDescription] = useState("");
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
    if (!username || selectedSports.length === 0 || !skillLevel) {
      setError("Please fill in all required fields.");
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
          <h1 className="text-2xl font-semibold text-gray-900">
            Set up your profile
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Tell us a bit about yourself
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-7 shadow-sm space-y-6">
          <div>
            <label className="block text-sm text-gray-500 mb-1.5">
              Username <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="ex: Andrei01"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1.5">Bio</label>
            <textarea
              placeholder="ex: Love playing football on weekends..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
            />
          </div>

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

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? "Saving..." : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
