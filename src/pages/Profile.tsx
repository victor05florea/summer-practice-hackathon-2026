import { useState } from "react";
import { supabase } from "../services/supabase";
import { type Profile } from "../types";
import { SPORTS, LEVELS, GENDERS } from "../constants/sports";

interface Props {
  profile: Profile;
  onNavigate: (page: "home" | "profile") => void;
  onProfileUpdate: () => void;
}

export default function ProfilePage({
  profile,
  onNavigate,
  onProfileUpdate,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(profile.username);
  const [description, setDescription] = useState(profile.description || "");
  const [age, setAge] = useState(profile.age?.toString() || "");
  const [city, setCity] = useState(profile.city || "");
  const [gender, setGender] = useState(profile.gender || "");
  const [sports, setSports] = useState<string[]>(profile.sports || []);
  const [skillLevel, setSkillLevel] = useState(profile.skill_level || "");
  const [saving, setSaving] = useState(false);

  const toggleSport = (sport: string) => {
    setSports((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport],
    );
  };

  const handleSave = async () => {
    setSaving(true);
    await supabase
      .from("profiles")
      .update({
        username,
        description,
        age: age ? parseInt(age) : null,
        city,
        gender,
        sports,
        skill_level: skillLevel,
      })
      .eq("id", profile.id);
    setSaving(false);
    setEditing(false);
    onProfileUpdate();
  };

  const handleCancel = () => {
    setUsername(profile.username);
    setDescription(profile.description || "");
    setAge(profile.age?.toString() || "");
    setCity(profile.city || "");
    setGender(profile.gender || "");
    setSports(profile.sports || []);
    setSkillLevel(profile.skill_level || "");
    setEditing(false);
  };

  return (
    <div className="min-h-screen bg-[#0f1419]">
      <nav className="bg-[#1a1f26] border-b border-[#2a3038] px-6 h-14 flex items-center justify-between">
        <button
          onClick={() => onNavigate("home")}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-100 transition-colors"
        >
          <span>←</span>
          <span className="text-sm">Back</span>
        </button>
        <span className="text-sm font-medium text-gray-100">My Profile</span>
        <div className="w-9" />
      </nav>

      <div className="max-w-lg mx-auto px-4 py-5">
        <div className="bg-[#1a1f26] rounded-2xl border border-[#2a3038] p-6 text-center mb-4">
          <div className="w-20 h-20 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-2xl font-semibold mx-auto mb-3">
            {profile.username.slice(0, 2).toUpperCase()}
          </div>
          <h1 className="text-xl font-semibold text-gray-100">
            {profile.username}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {profile.city || "No city set"}
          </p>
        </div>

        <div className="bg-[#1a1f26] rounded-2xl border border-[#2a3038] p-6">
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm font-medium text-gray-100">Personal info</p>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="text-xs text-emerald-400 hover:text-emerald-300"
              >
                Edit
              </button>
            )}
          </div>

          {!editing ? (
            <div className="space-y-3.5 text-sm">
              <Row label="Username" value={profile.username} />
              <Row label="Bio" value={profile.description || "—"} />
              <Row label="Age" value={profile.age?.toString() || "—"} />
              <Row label="City" value={profile.city || "—"} />
              <Row label="Gender" value={profile.gender || "—"} />
              <Row label="Skill" value={profile.skill_level || "—"} />
              <div>
                <p className="text-xs text-gray-500 mb-2">Sports</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.sports?.map((s) => (
                    <span
                      key={s}
                      className="px-2.5 py-1 bg-emerald-500/15 text-emerald-400 text-xs rounded-full font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Field label="Username">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[#0f1419] border border-[#2a3038] rounded-lg text-gray-100 focus:outline-none focus:border-emerald-500"
                />
              </Field>

              <Field label="Bio">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-sm bg-[#0f1419] border border-[#2a3038] rounded-lg text-gray-100 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </Field>

              <div className="flex gap-3">
                <div className="flex-1">
                  <Field label="Age">
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-[#0f1419] border border-[#2a3038] rounded-lg text-gray-100 focus:outline-none focus:border-emerald-500"
                    />
                  </Field>
                </div>
                <div className="flex-1">
                  <Field label="City">
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-[#0f1419] border border-[#2a3038] rounded-lg text-gray-100 focus:outline-none focus:border-emerald-500"
                    />
                  </Field>
                </div>
              </div>

              <Field label="Gender">
                <div className="flex gap-2">
                  {GENDERS.map((g) => (
                    <button
                      key={g}
                      onClick={() => setGender(g)}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                        gender === g
                          ? "bg-emerald-500 text-white"
                          : "bg-[#0f1419] text-gray-400 border border-[#2a3038] hover:border-emerald-500/50"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Skill level">
                <div className="flex gap-2">
                  {LEVELS.map((l) => (
                    <button
                      key={l}
                      onClick={() => setSkillLevel(l)}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                        skillLevel === l
                          ? "bg-emerald-500 text-white"
                          : "bg-[#0f1419] text-gray-400 border border-[#2a3038] hover:border-emerald-500/50"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Sports">
                <div className="flex flex-wrap gap-1.5">
                  {SPORTS.map((s) => (
                    <button
                      key={s}
                      onClick={() => toggleSport(s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        sports.includes(s)
                          ? "bg-emerald-500 text-white"
                          : "bg-[#0f1419] text-gray-400 border border-[#2a3038] hover:border-emerald-500/50"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </Field>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCancel}
                  className="flex-1 py-2.5 bg-[#0f1419] text-gray-300 border border-[#2a3038] rounded-lg text-sm font-medium hover:bg-[#2a3038] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm text-gray-200">{value}</span>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-1.5">{label}</p>
      {children}
    </div>
  );
}
