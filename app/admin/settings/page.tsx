"use client";
import PasswordTab from "@/components/admin/settings/PasswordTab";
import PaymentTab from "@/components/admin/settings/PaymentTab";
import ProfileTab from "@/components/admin/settings/ProfileTab";
import SubadminsTab from "@/components/admin/settings/SubadminsTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { useAuthStore } from "@/lib/store/userStore";
import ManageAiKeysTab from "@/components/admin/settings/ManageAiKeysTab";

const AdminSettings = () => {
  const { profile } = useAuthStore();
  const isSubadmin = profile?.role === "subadmin";

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Tabs defaultValue="profile" className="w-full">
        {/* Responsive TabsList using flex instead of grid */}
        <TabsList
          className={`
            flex flex-col sm:flex-row 
            ${isSubadmin ? "w-auto" : "w-full"} 
            h-auto sm:h-10 
            p-1 
            gap-1 sm:gap-0
            mb-6
          `}
        >
          <TabsTrigger
            value="profile"
            className="w-full sm:w-auto justify-center"
          >
            Profile
          </TabsTrigger>

          {!isSubadmin && (
            <>
              <TabsTrigger
                value="password"
                className="w-full sm:w-auto justify-center"
              >
                Password
              </TabsTrigger>
              <TabsTrigger
                value="payment"
                className="w-full sm:w-auto justify-center"
              >
                Payment Details
              </TabsTrigger>
              <TabsTrigger
                value="subadmins"
                className="w-full sm:w-auto justify-center"
              >
                Manage Subadmins
              </TabsTrigger>

              <TabsTrigger
                value="ai-keys"
                className="w-full sm:w-auto justify-center"
              >
                Manage AI Keys
              </TabsTrigger>
            </>
          )}
        </TabsList>

        {/* Tab Contents - proper spacing to avoid overlap */}
        <div className="mt-6">
          <TabsContent value="profile" className="space-y-6">
            <ProfileTab />
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
