import { User } from "@/lib/types";
import Header from "./Header";
import SideBar from "./Sidebar";
import { useAuthStore } from "@/lib/store/userStore";

interface LayoutProps {
  user: User;
  title: string;
  description?: string;
  children: React.ReactNode;
}
const Layout = ({ user, title, description, children }: LayoutProps) => {
  const { profile, isAuthenticated } = useAuthStore();
  
  return (
    <div className="flex h-screen overflow-hidden">
      <div>
        {isAuthenticated && profile && (
          <SideBar
            role={profile.role} 
            userName={profile.name}
            userAvatar={profile.avatar}
          />
        )}
      </div>
      <div className="flex-1 overflow-auto">
        <div className="p-6 md:p-8">
          <Header title={title} description={description} />
          <main>{children}</main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
