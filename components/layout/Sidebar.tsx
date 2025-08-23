"use client";

import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Settings,
  Menu,
  Home,
  X,
  LogOut,
  Briefcase,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import { useAuth } from "@/lib/hooks/useAuth";
import { useAuthStore } from "@/lib/store/userStore";
import { toast } from "sonner";

interface SidebarProps {
  role: "admin" | "developer" | "client" | "subadmin";
  userName: string | null;
  userAvatar: string | null;
}

const SideBar = ({ role, userName, userAvatar }: SidebarProps) => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { logout } = useAuth();
  const { isAuthenticated, profile } = useAuthStore();

  // // Debug logs
  // useEffect(() => {
  //   console.log("Sidebar render - isAuthenticated:", isAuthenticated);
  //   console.log("Sidebar render - role:", role);
  //   console.log("Sidebar render - profile:", profile);
  // }, [isAuthenticated, role, profile]);

  // Don't render if not authenticated
  if (!isAuthenticated) {
    console.log("Sidebar not rendering - user not authenticated");
    return null;
  }

  // Use profile role if available, fallback to prop
  const userRole = profile?.role || role;
  
  // Don't render if no role
  if (!userRole) {
    console.log("Sidebar not rendering - no role available");
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
      href: "/admin/candidate-application",
      icon: <Briefcase size={20} />,
      title: "Candidate Applications",
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
  ];

  // Both admin and subadmin use admin links
  const links =
    userRole === "admin" || userRole === "subadmin"
      ? adminLinks
      : userRole === "developer"
      ? developerLinks
      : clientLinks;

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("You have been successfully logged out.");
      setIsMobileMenuOpen(false);
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isMobileMenuOpen && !target.closest('[data-sidebar]')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  return (
    <>
      {/* Mobile Menu Toggle Button - Fixed positioning with high z-index */}
      <Button
        variant="outline"
        size="icon"
        className={cn(
          "fixed top-4 left-4 z-[9999] lg:hidden transition-all duration-300",
          isMobileMenuOpen && "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsMobileMenuOpen(true)}
      >
        <Menu className="h-6 w-6" />
      </Button>

      {/* Sidebar Container */}
      <div
        data-sidebar
        className={cn(
          "fixed inset-y-0 left-0 z-[9998] w-64 bg-card shadow-lg transform transition-all duration-300 ease-in-out",
          "border-r border-border flex flex-col h-screen",
          // Desktop: always visible
          "lg:static lg:translate-x-0 lg:shadow-none",
          // Mobile: slide in/out
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="p-6 flex items-center justify-between border-b border-border">
          <Link
            href={
              userRole === "admin" || userRole === "subadmin"
                ? "/admin"
                : userRole === "developer"
                ? "/developer"
                : "/client"
            }
            className="flex items-center gap-2"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div className="rounded-md bg-primary p-1">
              <Home className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="font-bold capitalize">
              {userRole === "subadmin" ? "Admin" : userRole} Portal
            </h1>
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

        {/* Navigation Links */}
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-4 text-sm">
            {links.map((link, index) => (
              <Link
                key={index}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-accent/50",
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

        {/* User Info and Actions */}
        <div className="p-4">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="relative h-9 w-9">
              <img
                src={
                  userAvatar ||
                  profile?.avatar ||
                  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS8oghbsuzggpkknQSSU-Ch_xep_9v3m6EeBQ&s"
                }
                alt={userName || profile?.name || "User"}
                className="absolute inset-0 h-full w-full rounded-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {userName || profile?.name || "User"}
              </span>
              <span className="text-xs capitalize text-muted-foreground">
                {userRole === "subadmin" ? "Sub Admin" : userRole}
              </span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link
              href={
                userRole === "admin" || userRole === "subadmin"
                  ? "/admin/settings"
                  : userRole === "developer"
                  ? "/developer/settings"
                  : "/client/settings"
              }
              onClick={() => setIsMobileMenuOpen(false)}
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
          className="fixed inset-0 z-[9997] bg-black/50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
};

export default SideBar;
