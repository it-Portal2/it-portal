"use client";

import { Bell, User, Home } from "lucide-react";
import { Button } from "../ui/button";
import { motion } from "framer-motion";
import Link from "next/link";
interface DashboardHeaderProps {
  title: string;
  description?: string;
}

const Header = ({ title, description }: DashboardHeaderProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-6"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
      {/* <div className="flex items-center gap-2 mt-4 sm:mt-0">
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => console.log("Notifications clicked")}
        >
          <Bell className="h-5 w-5" />
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
            3
          </span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => console.log("User profile clicked")}
        >
          <User className="h-5 w-5" />
        </Button>
        <Link href={"/"}>
          {" "}
          <Button variant="outline" size="sm" className="ml-2">
            <Home className="h-4 w-4 mr-2" />
            Home
          </Button>
        </Link>
      </div> */}
    </motion.div>
  );
};
export default Header;
