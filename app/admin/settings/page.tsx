"use client";
import PasswordTab from "@/components/admin/settings/PasswordTab";
import PaymentTab from "@/components/admin/settings/PaymentTab";
import ProfileTab from "@/components/admin/settings/ProfileTab";
import SubadminsTab from "@/components/admin/settings/SubadminsTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { useAuthStore } from "@/lib/store/userStore";
import ManageAiKeysTab from "@/components/admin/settings/ManageAiKeysTab";
import ClientManagementTab from "@/components/admin/settings/ClientManagementTab";
import DeveloperManagementTab from "@/components/admin/settings/DeveloperManagementTab";
import { useState } from "react";
import { ChevronDown, User, Users, Code, Lock, CreditCard, UserPlus, Key } from "lucide-react";

const AdminSettings = () => {
  const { profile } = useAuthStore();
  const isSubadmin = profile?.role === "subadmin";
  const [activeTab, setActiveTab] = useState("profile");
  const [showDropdown, setShowDropdown] = useState(false);

  const tabConfig = [
    { value: "profile", label: "Profile", icon: User, show: true },
    { value: "clients", label: "Manage Clients", icon: Users, show: true },
    { value: "developers", label: "Manage Developers", icon: Code, show: true },
    { value: "password", label: "Password", icon: Lock, show: !isSubadmin },
    { value: "payment", label: "Payment Details", icon: CreditCard, show: !isSubadmin },
    { value: "subadmins", label: "Manage Subadmins", icon: UserPlus, show: !isSubadmin },
    { value: "ai-keys", label: "Manage AI Keys", icon: Key, show: !isSubadmin },
  ];

  const visibleTabs = tabConfig.filter(tab => tab.show);
  const currentTab = tabConfig.find(tab => tab.value === activeTab);

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Mobile Dropdown Navigation */}
        <div className="block md:hidden mb-6">
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-full flex items-center justify-between px-4 py-3 bg-background border border-border rounded-md hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3">
                {currentTab?.icon && <currentTab.icon className="h-5 w-5" />}
                <span className="font-medium">{currentTab?.label}</span>
              </div>
              <ChevronDown className={`h-5 w-5 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-md shadow-lg z-50"
              >
                {visibleTabs.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => {
                      setActiveTab(tab.value);
                      setShowDropdown(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent transition-colors first:rounded-t-md last:rounded-b-md ${
                      activeTab === tab.value ? 'bg-accent' : ''
                    }`}
                  >
                    <tab.icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </div>

        {/* Desktop Tabs - Two Rows for Better Spacing */}
        <div className="hidden md:block">
          <TabsList className="w-full h-auto p-1 grid grid-cols-4 gap-1">
            {visibleTabs.slice(0, 4).map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center gap-2 px-3 py-2"
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden lg:inline">{tab.label}</span>
                <span className="lg:hidden text-xs">{tab.label.split(' ')[0]}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          
          {visibleTabs.length > 4 && (
            <TabsList className="w-full h-auto p-1 mt-2 grid grid-cols-3 gap-1">
              {visibleTabs.slice(4).map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex items-center gap-2 px-3 py-2"
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="hidden lg:inline">{tab.label}</span>
                  <span className="lg:hidden text-xs">{tab.label.split(' ')[0]}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          )}
        </div>

        {/* Tab Contents */}
        <div className="mt-6">
          <TabsContent value="profile" className="space-y-6">
            <ProfileTab />
          </TabsContent>
          <TabsContent value="clients" className="space-y-6">
            <ClientManagementTab />
          </TabsContent>
          <TabsContent value="developers" className="space-y-6">
            <DeveloperManagementTab />
          </TabsContent>
          {!isSubadmin && (
            <>
              <TabsContent value="password" className="space-y-6">
                <PasswordTab />
              </TabsContent>
              <TabsContent value="payment" className="space-y-6">
                <PaymentTab />
              </TabsContent>
              <TabsContent value="subadmins" className="space-y-6">
                <SubadminsTab />
              </TabsContent>
              <TabsContent value="ai-keys" className="space-y-6">
                <ManageAiKeysTab />
              </TabsContent>
            </>
          )}
        </div>
      </Tabs>
    </motion.div>
  );
};

export default AdminSettings;