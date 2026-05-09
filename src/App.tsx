import { useEffect, useState } from "react";
import { type Session } from "@supabase/supabase-js";
import { supabase } from "./services/supabase";
import { useProfile } from "./hooks/useProfile";
import Login from "./pages/Login";
import Informations from "./pages/Informations";
import Home from "./pages/Home";
import ProfilePage from "./pages/Profile";

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [page, setPage] = useState<"home" | "profile">("home");
  const {
    profile,
    loading: profileLoading,
    refetch,
  } = useProfile(session?.user?.id);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSessionLoading(false);
    });
    supabase.auth.onAuthStateChange((_e, session) => setSession(session));
  }, []);

  if (sessionLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-[#0f1419] flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    );
  }
  if (!session) return <Login />;
  if (!profile?.username) return <Informations onComplete={refetch} />;
  if (page === "profile") {
    return (
      <ProfilePage
        profile={profile}
        onNavigate={setPage}
        onProfileUpdate={refetch}
      />
    );
  }

  return (
    <Home profile={profile} onNavigate={setPage} onProfileUpdate={refetch} />
  );
}
export default App;
