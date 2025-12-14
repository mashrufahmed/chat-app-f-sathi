import { createContext, useContext, useState } from 'react';



// 1️⃣ Define your context type
interface UserContextType {
  user: string;
  setUser: (user: string) => void;
}

// 2️⃣ Create context — make sure name starts with a capital (convention)
const UserContext = createContext<UserContextType | null>(null);

// 3️⃣ Provider component
export default function UserContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<string>('');

  const value: UserContextType = {
    user,
    setUser,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

// 4️⃣ Custom hook for consuming the context
export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserContextProvider');
  }
  return context;
}
