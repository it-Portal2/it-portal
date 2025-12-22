"use client";

import { motion } from "framer-motion";
import Layout from "@/components/layout/Layout";
import { useAuthStore } from "@/lib/store/userStore";
import type { User } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ExternalLink,
  CheckCircle,
  Star,
  Layers,
  Gift,
  Clock,
  Award,
} from "lucide-react";
import { CEHPOINT_SERVICES, getHighlightColor } from "@/lib/services-data";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
    },
  },
};

export default function ServicesPage() {
  const { profile } = useAuthStore();

  return (
    <Layout
      user={profile || ({} as User)}
      title="Explore Our Services"
      description="Discover additional Cehpoint services to help grow your business"
    >
      <div className="space-y-10">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 md:p-10 text-white shadow-2xl"
        >
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-300 rounded-full blur-3xl animate-pulse delay-700" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <Layers className="h-6 w-6" />
              </div>
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm text-sm px-3 py-1">
                Exclusive Client Benefits
              </Badge>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
              Unlock Premium Services <br className="hidden sm:block" />
              <span className="text-yellow-300">Built for Your Success</span>
            </h2>

            <p className="text-white/90 text-lg max-w-2xl mb-6 leading-relaxed">
              As a valued client, you get exclusive access to our complete
              ecosystem. From free security audits to AI tools - everything you
              need to scale your business.
            </p>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <Award className="h-5 w-5 text-yellow-300" />
                <span>ISO 9001:2015 Certified</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <Star className="h-5 w-5 text-yellow-300" />
                <span>500+ Happy Clients</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <Clock className="h-5 w-5 text-yellow-300" />
                <span>24/7 Support</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Services Grid - Clean Professional Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {CEHPOINT_SERVICES.map((service) => {
            const IconComponent = service.icon;
            return (
              <motion.div key={service.id} variants={itemVariants}>
                <Card className="group h-full border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className={`p-3 rounded-xl ${service.bgColor}`}>
                        <IconComponent
                          className={`h-6 w-6 ${service.iconColor}`}
                        />
                      </div>
                      <Badge
                        className={getHighlightColor(service.highlightType)}
                      >
                        {service.highlight}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                      {service.title}
                    </CardTitle>
                    <CardDescription className="text-primary/80 font-medium">
                      {service.tagline}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {service.description}
                    </p>

                    {/* Features List */}
                    <ul className="space-y-2">
                      {service.features.map((feature, idx) => (
                        <li
                          key={idx}
                          className="flex items-center gap-2 text-sm"
                        >
                          <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <a
                      href={service.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full mt-4"
                    >
                      <Button className="w-full group/btn">
                        <span>Explore Now</span>
                        <ExternalLink className="ml-2 h-4 w-4 group-hover/btn:translate-x-0.5 transition-transform" />
                      </Button>
                    </a>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-center shadow-xl"
        >
          <div className="absolute inset-0 bg-grid-white/5" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-4">
              <Gift className="h-5 w-5 text-yellow-400" />
              <span className="text-white/80 text-sm">
                Special Offer for Clients
              </span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">
              Need Something Custom?
            </h3>
            <p className="text-slate-300 mb-6 max-w-lg mx-auto">
              Our expert team can build anything you imagine. Get a personalized
              quote with AI-powered estimation.
            </p>
            <a
              href="https://proposals.cehpoint.co.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block"
            >
              <Button
                size="lg"
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold px-8 hover:opacity-90 hover:scale-105 transition-all shadow-lg"
              >
                Get Custom Quote
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
