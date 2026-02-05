import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase, Profile } from "../services/supabase";
import { notifications } from "@mantine/notifications";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile from database
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
      // Profile might not exist yet if trigger hasn't run
      setProfile(null);
    }
  };

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sign up new user
  const signUp = async (
    email: string,
    password: string,
    displayName: string
  ) => {
    try {
      // Create auth user with display_name in metadata
      // The database trigger will automatically create the profile
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        notifications.show({
          title: "Account created!",
          message: "Welcome to Resumerator 9000",
          color: "green",
        });
      }
    } catch (error) {
      const authError = error as AuthError;
      notifications.show({
        title: "Sign up failed",
        message: authError.message || "Could not create account",
        color: "red",
      });
      throw error;
    }
  };

  // Sign in existing user
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      notifications.show({
        title: "Welcome back!",
        message: "Successfully signed in",
        color: "green",
      });
    } catch (error) {
      const authError = error as AuthError;
      notifications.show({
        title: "Sign in failed",
        message: authError.message || "Invalid credentials",
        color: "red",
      });
      throw error;
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      notifications.show({
        title: "Signed out",
        message: "See you next time!",
        color: "blue",
      });
    } catch (error) {
      const authError = error as AuthError;
      notifications.show({
        title: "Sign out failed",
        message: authError.message || "Could not sign out",
        color: "red",
      });
      throw error;
    }
  };

  // Request password reset
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      notifications.show({
        title: "Check your email",
        message: "Password reset link sent",
        color: "blue",
      });
    } catch (error) {
      const authError = error as AuthError;
      notifications.show({
        title: "Reset failed",
        message: authError.message || "Could not send reset email",
        color: "red",
      });
      throw error;
    }
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
