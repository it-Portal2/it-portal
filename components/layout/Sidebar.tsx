"use client";

import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Settings,
  Menu,
  Home,
  X,
  LogOut,
  Briefcase,
  CheckSquare,
  MessageSquare,
  CreditCard 
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import { useAuth } from "@/lib/hooks/useAuth";
import { toast } from "sonner";

interface SidebarProps {
  role: "admin" | "developer" | "client";
  userName: string | null;
  userAvatar: string | null;
}

const SideBar = ({ role, userName, userAvatar }: SidebarProps) => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { logout, isAuthenticated } = useAuth();

  if (!isAuthenticated || !role) {
    return null;
  }

  const adminLinks = [
    { href: "/admin", icon: <LayoutDashboard size={20} />, title: "Dashboard" },
    {
      href: "/admin/requests",
      icon: <FileText size={20} />,
      title: "Project Requests",
    },
    {
      href: "/admin/ongoing",
      icon: <Clock size={20} />,
      title: "Ongoing Projects",
    },
    {
      href: "/admin/completed",
      icon: <CheckCircle size={20} />,
      title: "Completed Projects",
    },
    {
      href: "/admin/rejected",
      icon: <XCircle size={20} />,
      title: "Rejected Projects",
    },
    {
      href: "/admin/payments",
      icon: <CreditCard size={20} />,
      title: "All payment details",
    },
  ];

  const developerLinks = [
    {
      href: "/developer",
      icon: <LayoutDashboard size={20} />,
      title: "Dashboard",
    },
    {
      href: "/developer/projects",
      icon: <Briefcase size={20} />,
      title: "My Projects",
    },

  ];

  const clientLinks = [
    {
      href: "/client",
      icon: <LayoutDashboard size={20} />,
      title: "Dashboard",
    },
           {
      href: "/client/payment",
      icon: <CreditCard size={20} />,
      title: "Payment",
    },
    // {
    //   href: "/client/chat",
    //   icon: <MessageSquare size={20} />,
    //   title: "Support Chat",
    // },
  ];

  const links =
    role === "admin"
      ? adminLinks
      : role === "developer"
      ? developerLinks
      : clientLinks;

  const handleLogout = async () => {
    await logout();
    toast.success("You have been successfully logged out.");
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      {!isMobileMenuOpen && (
        <Button
          variant="outline"
          size="icon"
          className="fixed top-4 left-4 z-50 lg:hidden" // Fixed here
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <Menu className="h-6 w-6" />
        </Button>
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-card transform transition-transform duration-300 ease-in-out",
          "border-r flex flex-col h-screen",
          "lg:static lg:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6 flex items-center justify-between">
          <Link
            href={
              role === "admin"
                ? "/admin"
                : role === "developer"
                ? "/developer"
                : "/client"
            }
            className="flex items-center gap-2"
          >
            <div className="rounded-md bg-primary p-1">
              <Home className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="font-bold capitalize">{role} Portal</h1>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-4 text-sm">
            {links.map((link, index) => (
              <Link
                key={index}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  pathname === link.href && "bg-accent text-primary font-medium"
                )}
              >
                {link.icon}
                {link.title}
              </Link>
            ))}
          </nav>
        </div>

        <Separator />

        <div className="p-4">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="relative h-9 w-9">
              <img
                src={
                  userAvatar ||
                  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS8oghbsuzggpkknQSSU-Ch_xep_9v3m6EeBQ&s"
                }
                alt={userName || ""}
                className="absolute inset-0 h-full w-full rounded-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{userName}</span>
              <span className="text-xs capitalize text-muted-foreground">
                {role}
              </span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link
              href={
                role === "admin"
                  ? "/admin/settings"
                  : role === "developer"
                  ? "/developer/settings"
                  : "/client/settings"
              }
            >
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
};

export default SideBar;
