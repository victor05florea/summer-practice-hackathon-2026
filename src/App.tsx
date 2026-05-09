import { useEffect, useState } from "react";
import { supabase } from "./services/supabase";
import { useProfile } from "./hooks/useProfile";
import Login from "./pages/Login";
import Onboarding from "./pages/Informations";
import Button from "./components/Button";

function App() {
  const [session, setSession] = useState<any>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const { profile, loading: profileLoading } = useProfile(session?.user?.id);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSessionLoading(false);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  if (sessionLoading || profileLoading)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    );

  if (!session) return <Login />;
  if (!profile?.username) return <Onboarding />;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome, {profile.username} 👋
        </h1>
        <p className="text-gray-500 mt-2 text-sm">{session.user.email}</p>
        <Button
          label="Logout"
          variant="danger"
          onClick={() => supabase.auth.signOut()}
        />
      </div>
    </div>
  );
}

export default App;
