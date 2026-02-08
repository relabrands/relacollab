import { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

// Define available roles
export type UserRole = "brand" | "creator" | "admin" | null;

interface AuthContextType {
    user: User | null;
    role: UserRole;
    loading: boolean;
    onboardingCompleted: boolean;
    signInWithGoogle: (role: UserRole) => Promise<UserRole>;
    loginWithEmail: (email: string, pass: string) => Promise<UserRole>;
    registerWithEmail: (email: string, pass: string, name: string, role: UserRole) => Promise<UserRole>;
    updateRole: (role: UserRole) => Promise<UserRole>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    role: null,
    loading: true,
    onboardingCompleted: false,
    signInWithGoogle: async () => null,
    loginWithEmail: async () => null,
    registerWithEmail: async () => null,
    updateRole: async () => null,
    logout: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<UserRole>(null);
    const [loading, setLoading] = useState(true);
    const [onboardingCompleted, setOnboardingCompleted] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);

            if (currentUser) {
                // Fetch user role from Firestore
                try {
                    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setRole(userData.role as UserRole);
                        setOnboardingCompleted(!!userData.onboardingCompleted);
                    } else {
                        // New user, wait for sign up process to set role or handle it here
                        setRole(null);
                        setOnboardingCompleted(false);
                    }
                } catch (error) {
                    console.error("Error fetching user role:", error);
                    setRole(null);
                    setOnboardingCompleted(false);
                }
            } else {
                setRole(null);
                setOnboardingCompleted(false);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async (selectedRole: UserRole): Promise<UserRole> => {
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Check if user exists
            const userDoc = await getDoc(doc(db, "users", user.uid));

            let finalRole = selectedRole;

            if (!userDoc.exists() && selectedRole) {
                // Create new user with selected role
                await setDoc(doc(db, "users", user.uid), {
                    email: user.email,
                    role: selectedRole,
                    createdAt: new Date().toISOString(),
                    displayName: user.displayName,
                    photoURL: user.photoURL
                });
                setRole(selectedRole);
            } else if (userDoc.exists()) {
                finalRole = userDoc.data().role as UserRole;
                setRole(finalRole);
            }
            return finalRole;
        } catch (error) {
            console.error("Error signing in:", error);
            throw error;
        }
    };

    const loginWithEmail = async (email: string, pass: string): Promise<UserRole> => {
        try {
            const result = await signInWithEmailAndPassword(auth, email, pass);
            const user = result.user;
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const userRole = userDoc.data().role as UserRole;
                setRole(userRole);
                return userRole;
            }
            return null;
        } catch (error) {
            console.error("Error logging in:", error);
            throw error;
        }
    };

    const registerWithEmail = async (email: string, pass: string, name: string, selectedRole: UserRole): Promise<UserRole> => {
        try {
            const result = await createUserWithEmailAndPassword(auth, email, pass);
            const user = result.user;
            await updateProfile(user, { displayName: name });

            await setDoc(doc(db, "users", user.uid), {
                email: user.email,
                role: selectedRole,
                status: selectedRole === "creator" ? "pending" : "active", // Creators need approval
                createdAt: new Date().toISOString(),
                displayName: name,
                photoURL: null,
                onboardingCompleted: false
            });
            setRole(selectedRole);
            return selectedRole;
        } catch (error) {
            console.error("Error registering:", error);
            throw error;
        }
    };

    const updateRole = async (selectedRole: UserRole): Promise<UserRole> => {
        if (!user || !selectedRole) return null;
        try {
            await setDoc(doc(db, "users", user.uid), {
                email: user.email,
                role: selectedRole,
                status: selectedRole === "creator" ? "pending" : "active",
                createdAt: new Date().toISOString(),
                displayName: user.displayName,
                photoURL: user.photoURL,
                onboardingCompleted: false
            });
            setRole(selectedRole);
            return selectedRole;
        } catch (error) {
            console.error("Error updating role:", error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            setRole(null);
            setUser(null);
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, role, loading, onboardingCompleted, signInWithGoogle, loginWithEmail, registerWithEmail, updateRole, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
