"use client";

import type React from "react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { UserIcon, ShieldIcon, CodeIcon } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/lib/hooks/useAuth";
import { UserRole } from "@/lib/store/userStore";

export default function AuthPage() {
  const { signUp, login, googleLogin, isLoading, error } = useAuth();

  const [showStaffLogin, setShowStaffLogin] = useState(false);

  // Client signup form state
  const [clientSignupForm, setClientSignupForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  // Show toast for errors from auth hook
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Handle client signup form changes
  const handleClientSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClientSignupForm({
      ...clientSignupForm,
      [e.target.id]: e.target.value,
    });
  };

  // Handle login form changes
  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginForm({
      ...loginForm,
      [e.target.id]: e.target.value,
    });
  };

  // Handle client signup
  const handleClientSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (clientSignupForm.password !== clientSignupForm.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    try {
      const success = await signUp(
        clientSignupForm.email,
        clientSignupForm.password,
        clientSignupForm.name,
        clientSignupForm.phone
      );

      if (success) {
        toast.success("Account created successfully!");
      }
    } catch (error) {
      console.error("Signup error:", error);
    }
  };

  // Handle login (for all roles)
  const handleLogin = async (e: React.FormEvent, role: UserRole) => {
    e.preventDefault();

    try {
      const success = await login(loginForm.email, loginForm.password, role);

      if (success) {
        toast.success(`Welcome back, ${role}!`);
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  // Handle Google sign-in
  const handleGoogleSignIn = async () => {
    try {
      const success = await googleLogin();

      if (success) {
        toast.success("Google sign-in successful!");
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 },
    },
  };

  const fadeVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.3 },
    },
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <motion.div
        className="w-full max-w-5xl"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Main heading */}
        {/* <motion.div className="text-center mb-8" variants={itemVariants}>
          <h1 className="text-4xl font-bold text-blue-700">
            Welcome to Our Platform
          </h1>
          <p className="text-gray-600 mt-2">Sign up or log in to get started</p>
        </motion.div> */}

        {/* Toggle between client and staff sections */}
        <motion.div
          className="flex justify-center mb-8"
          variants={itemVariants}
        >
          <div className="bg-white rounded-full p-1 shadow-md">
            <Button
              variant={showStaffLogin ? "ghost" : "default"}
              className={`rounded-full px-6 ${
                !showStaffLogin ? "bg-blue-600 text-white" : ""
              }`}
              onClick={() => setShowStaffLogin(false)}
            >
              <UserIcon className="mr-2 h-4 w-4" />
              Client Area
            </Button>
            <Button
              variant={!showStaffLogin ? "ghost" : "default"}
              className={`rounded-full px-6 ${
                showStaffLogin ? "bg-blue-600 text-white" : ""
              }`}
              onClick={() => setShowStaffLogin(true)}
            >
              <ShieldIcon className="mr-2 h-4 w-4" />
              Staff Login
            </Button>
          </div>
        </motion.div>

        {/* Client Authentication Section */}
        {!showStaffLogin && (
          <motion.div
            className="grid md:grid-cols-5 gap-8"
            variants={fadeVariants}
            initial="hidden"
            animate="visible"
            key="client-section"
          >
            {/* Left side - Welcome message */}
            <motion.div
              className="md:col-span-2 flex flex-col justify-center p-8 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl shadow-xl"
              variants={itemVariants}
            >
              <h2 className="text-3xl font-bold mb-4">Client Portal</h2>
              <p className="text-lg opacity-90 mb-8">
                Join our platform to manage your projects efficiently and
                collaborate with our team.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <p>Real-time project tracking</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <p>Dedicated support team</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <p>Secure and reliable platform</p>
                </div>
              </div>
            </motion.div>

            {/* Right side - Client Auth forms */}
            <motion.div className="md:col-span-3" variants={itemVariants}>
              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl text-center">
                    Client Authentication
                  </CardTitle>
                  <CardDescription className="text-center">
                    Sign up for a new account or log in to your existing account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="signup" className="w-full">
                    <TabsList className="grid grid-cols-2 w-full mb-6">
                      <TabsTrigger value="signup">Sign Up</TabsTrigger>
                      <TabsTrigger value="login">Log In</TabsTrigger>
                    </TabsList>

                    {/* Client Signup Tab */}
                    <TabsContent value="signup">
                      <motion.form
                        onSubmit={handleClientSignup}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Your name</Label>
                            <Input
                              id="name"
                              placeholder="Name"
                              value={clientSignupForm.name}
                              onChange={handleClientSignupChange}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Your email</Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="Email"
                              value={clientSignupForm.email}
                              onChange={handleClientSignupChange}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone">Your phone</Label>
                            <Input
                              id="phone"
                              type="tel"
                              placeholder="Phone"
                              value={clientSignupForm.phone}
                              onChange={handleClientSignupChange}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="password">
                              Enter your password
                            </Label>
                            <Input
                              id="password"
                              type="password"
                              placeholder="Password"
                              value={clientSignupForm.password}
                              onChange={handleClientSignupChange}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="confirmPassword">
                              Confirm password
                            </Label>
                            <Input
                              id="confirmPassword"
                              type="password"
                              placeholder="Confirm password"
                              value={clientSignupForm.confirmPassword}
                              onChange={handleClientSignupChange}
                              required
                            />
                          </div>
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Button
                              type="submit"
                              className="w-full"
                              disabled={isLoading}
                            >
                              {isLoading
                                ? "Creating account..."
                                : "Create account"}
                            </Button>
                          </motion.div>
                        </div>
                      </motion.form>

                      <div className="mt-6">
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <Separator />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                              Or continue with
                            </span>
                          </div>
                        </div>

                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            variant="outline"
                            className="w-full mt-4 flex items-center gap-2"
                            onClick={handleGoogleSignIn}
                            disabled={isLoading}
                          >
                            <Image
                              src="/google.png"
                              width={500}
                              height={500}
                              alt="Picture of the author"
                              className="h-4 w-4"
                            />
                            Google
                          </Button>
                        </motion.div>
                      </div>
                    </TabsContent>

                    {/* Client Login Tab */}
                    <TabsContent value="login">
                      <motion.form
                        onSubmit={(e) => handleLogin(e, "client")}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="client-email">Email</Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="Email"
                              value={loginForm.email}
                              onChange={handleLoginChange}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="client-password">Password</Label>
                            <Input
                              id="password"
                              type="password"
                              placeholder="Password"
                              value={loginForm.password}
                              onChange={handleLoginChange}
                              required
                            />
                          </div>
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Button
                              type="submit"
                              className="w-full"
                              disabled={isLoading}
                            >
                              {isLoading ? "Logging in..." : "Login as Client"}
                            </Button>
                          </motion.div>
                        </div>
                      </motion.form>

                      <div className="mt-6">
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <Separator />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                              Or continue with
                            </span>
                          </div>
                        </div>

                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            variant="outline"
                            className="w-full mt-4 flex items-center gap-2"
                            onClick={handleGoogleSignIn}
                            disabled={isLoading}
                          >
                            <Image
                              src="/google.png"
                              width={500}
                              height={500}
                              alt="Picture of the author"
                              className="h-4 w-4"
                            />
                            Google
                          </Button>
                        </motion.div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
                <CardFooter className="flex justify-center text-sm text-muted-foreground">
                  By continuing, you agree to our Terms of Service and Privacy
                  Policy.
                </CardFooter>
              </Card>
            </motion.div>
          </motion.div>
        )}

        {/* Staff Login Section */}
        {showStaffLogin && (
          <motion.div
            className="grid md:grid-cols-5 gap-8"
            variants={fadeVariants}
            initial="hidden"
            animate="visible"
            key="staff-section"
          >
            {/* Left side - Staff info */}
            <motion.div
              className="md:col-span-2 flex flex-col justify-center p-8 bg-gradient-to-br from-indigo-700 to-purple-700 text-white rounded-2xl shadow-xl"
              variants={itemVariants}
            >
              <h2 className="text-3xl font-bold mb-4">Staff Portal</h2>
              <p className="text-lg opacity-90 mb-8">
                Secure access for administrators and developers to manage the
                platform.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <ShieldIcon className="h-6 w-6" />
                  </div>
                  <p>Admin dashboard access</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <CodeIcon className="h-6 w-6" />
                  </div>
                  <p>Developer tools and resources</p>
                </div>
              </div>
            </motion.div>

            {/* Right side - Staff Auth forms */}
            <motion.div className="md:col-span-3" variants={itemVariants}>
              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl text-center">
                    Staff Login
                  </CardTitle>
                  <CardDescription className="text-center">
                    Secure access for administrators and developers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="admin" className="w-full">
                    <TabsList className="grid grid-cols-2 mb-6">
                      <TabsTrigger value="admin">
                        <ShieldIcon className="mr-2 h-4 w-4" />
                        Admin
                      </TabsTrigger>
                      <TabsTrigger value="developer">
                        <CodeIcon className="mr-2 h-4 w-4" />
                        Developer
                      </TabsTrigger>
                    </TabsList>

                    {/* Admin Login Tab */}
                    <TabsContent value="admin">
                      <motion.form
                        onSubmit={(e) => handleLogin(e, "admin")}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="admin-email">Admin Email</Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="Admin Email"
                              value={loginForm.email}
                              onChange={handleLoginChange}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="admin-password">Password</Label>
                            <Input
                              id="password"
                              type="password"
                              placeholder="Password"
                              value={loginForm.password}
                              onChange={handleLoginChange}
                              required
                            />
                          </div>
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Button
                              type="submit"
                              className="w-full"
                              disabled={isLoading}
                            >
                              {isLoading ? "Logging in..." : "Login as Admin"}
                            </Button>
                          </motion.div>
                        </div>
                      </motion.form>
                    </TabsContent>

                    {/* Developer Login Tab */}
                    <TabsContent value="developer">
                      <motion.form
                        onSubmit={(e) => handleLogin(e, "developer")}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="developer-email">
                              Developer Email
                            </Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="Developer Email"
                              value={loginForm.email}
                              onChange={handleLoginChange}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="developer-password">Password</Label>
                            <Input
                              id="password"
                              type="password"
                              placeholder="Password"
                              value={loginForm.password}
                              onChange={handleLoginChange}
                              required
                            />
                          </div>
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Button
                              type="submit"
                              className="w-full"
                              disabled={isLoading}
                            >
                              {isLoading
                                ? "Logging in..."
                                : "Login as Developer"}
                            </Button>
                          </motion.div>
                        </div>
                      </motion.form>
                    </TabsContent>
                  </Tabs>
                </CardContent>
                <CardFooter className="flex justify-center text-sm text-muted-foreground">
                  Staff access is restricted to authorized personnel only.
                </CardFooter>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
