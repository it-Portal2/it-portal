"use client"
import PasswordTab from "@/components/admin/settings/PasswordTab"
import PaymentTab from "@/components/admin/settings/PaymentTab"
import ProfileTab from "@/components/admin/settings/ProfileTab"
import SubadminsTab from "@/components/admin/settings/SubadminsTab"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"
import { useAuthStore } from "@/lib/store/userStore"

const AdminSettings = () => {
  const { profile } = useAuthStore()
  
  // Check if user is subadmin
  const isSubadmin = profile?.role === "subadmin"
  
  return (
    <motion.div
      className="container mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className={`grid ${isSubadmin ? 'grid-cols-1' : 'grid-cols-4'} w-full md:w-auto`}>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          
          {/* Only show these tabs if user is NOT a subadmin */}
          {!isSubadmin && (
            <>
              <TabsTrigger value="password">Password</TabsTrigger>
              <TabsTrigger value="payment">Payment Details</TabsTrigger>
              <TabsTrigger value="subadmins">Manage Subadmins</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="profile" className="space-y-6 mt-6">
          <ProfileTab />
        </TabsContent>

        {/* Only render these tabs if user is NOT a subadmin */}
        {!isSubadmin && (
          <>
            <TabsContent value="password" className="space-y-6 mt-6">
              <PasswordTab />
            </TabsContent>

            <TabsContent value="payment" className="space-y-6 mt-6">
              <PaymentTab />
            </TabsContent>

            <TabsContent value="subadmins" className="space-y-6 mt-6">
              <SubadminsTab />
            </TabsContent>
          </>
        )}
      </Tabs>
    </motion.div>
  )
}

export default AdminSettings
