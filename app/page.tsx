"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Users, TrendingUp, Shield, Zap, Target, Bot } from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-emerald-100 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2 group">
              <div className="w-9 h-9 bg-gradient-to-tr from-primary to-accent rounded-xl flex items-center justify-center shadow-md transition-transform group-hover:scale-110">
                <TrendingUp className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                StartupMentor
              </span>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="hover:text-primary transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="hover:text-primary transition-colors">
                How It Works
              </a>
            </nav>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground" asChild>
                <Link href="/auth/signin">Sign In</Link>
              </Button>
              <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg hover:from-emerald-700 hover:to-teal-700" asChild>
                <Link href="/auth/signup">
                  Get Started
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 lg:py-40 overflow-hidden">
        {/* Animated Background */}
        <motion.div
          initial={{ backgroundPosition: "0% 50%" }}
          animate={{ backgroundPosition: "100% 50%" }}
          transition={{ duration: 20, repeat: Infinity, repeatType: "reverse" }}
          className="absolute inset-0 -z-10 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 bg-[length:200%_200%] opacity-20"
        />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <Badge
              variant="secondary"
              className="mb-6 bg-gradient-to-r from-primary/10 to-accent/10 text-primary border-none"
            >
              AI-Powered Chatbot
            </Badge>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight mb-6"
          >
            Smarter Guidance for{" "}
            <motion.span
              className="bg-clip-text text-transparent font-extrabold"
              style={{
                backgroundImage: "linear-gradient(270deg, #7928ca, #ff0080, #00f5a0, #ff8c00, #7928ca)",
                backgroundSize: "600% 600%",
              }}
              animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            >
              Entrepreneurs & Investors
            </motion.span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 1 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            A chatbot that empowers entrepreneurs and investors with instant insights, strategic
            guidance, and data-driven decisions — anytime, anywhere.
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <Button
              size="lg"
              className="px-8 text-lg font-semibold shadow-md bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              asChild
            >
              <Link href="/auth/signup">
                I&apos;m an Entrepreneur
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="px-8 text-lg font-semibold border-2 border-primary text-primary hover:bg-primary hover:text-white"
              asChild
            >
              <Link href="/auth/signup">I&apos;m an Investor</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gradient-to-b from-card/50 to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4 text-card-foreground">
              Everything You Need to{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Succeed
              </span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Unlock tailored insights, practical advice, and resources with our intelligent chatbot.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[
              {
                icon: Target,
                title: "Smart Guidance",
                desc: "Role-specific answers whether you’re pitching, scaling, or evaluating opportunities.",
              },
              {
                icon: Bot,
                title: "AI Assistant",
                desc: "Instantly ask about business strategy, funding, or markets with our chatbot.",
              },
              {
                icon: Shield,
                title: "Secure Platform",
                desc: "Enterprise-grade security keeps your conversations and data safe.",
              },
              {
                icon: Users,
                title: "Verified Knowledge",
                desc: "Responses powered by trusted insights for accurate decision-making.",
              },
              {
                icon: Zap,
                title: "Real-time Insights",
                desc: "Stay ahead with the latest startup and investment trends.",
              },
              {
                icon: TrendingUp,
                title: "Decision Support",
                desc: "Simplify choices with structured, AI-powered recommendations.",
              },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
              >
                <Card className="p-6 border-border bg-card/50 backdrop-blur-md shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                  <CardHeader>
                    <div className="w-14 h-14 mb-6 bg-gradient-to-tr from-primary/10 to-accent/10 rounded-xl flex items-center justify-center">
                      <feature.icon className="w-7 h-7 text-primary" />
                    </div>
                    <CardTitle className="text-xl font-semibold mb-2">{feature.title}</CardTitle>
                    <CardDescription className="text-muted-foreground">{feature.desc}</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-6">Get Started in 3 Steps</h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-16">
            No long forms. No waiting. Just chat, learn, and grow with AI-driven guidance.
          </p>
          <div className="grid md:grid-cols-3 gap-10">
            {[
              {
                step: "1",
                title: "Choose Your Role",
                desc: "Entrepreneur or investor? Personalize the chatbot to your needs.",
                color: "from-primary to-accent",
              },
              {
                step: "2",
                title: "Ask Your Questions",
                desc: "Engage with the chatbot on funding, scaling, or market evaluation.",
                color: "from-accent to-primary",
              },
              {
                step: "3",
                title: "Apply Insights",
                desc: "Turn AI-powered guidance into smarter decisions instantly.",
                color: "from-primary to-accent",
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.2, duration: 0.6 }}
                viewport={{ once: true }}
              >
                <div className="text-center">
                  <div
                    className={`w-20 h-20 mb-6 rounded-full flex items-center justify-center mx-auto bg-gradient-to-r ${item.color} text-white font-bold text-3xl shadow-md`}
                  >
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold mb-4">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-28 bg-gradient-to-r from-primary via-accent to-primary text-center relative overflow-hidden">
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 left-0 w-full h-full bg-white/10"
        />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-extrabold text-white mb-6"
          >
            Start Chatting with AI Today
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            viewport={{ once: true }}
            className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-10"
          >
            StartupMentor is free for entrepreneurs and investors. Get instant, tailored insights.
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Button
              size="lg"
              variant="secondary"
              className="px-8 text-lg font-semibold bg-white text-primary hover:bg-white/90 shadow-md"
              asChild
            >
              <Link href="/auth/signup">
                Join as Entrepreneur
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              className="px-8 text-lg font-semibold border-2 border-white text-white hover:bg-white hover:text-primary bg-transparent"
              asChild
            >
              <Link href="/auth/signup">Join as Investor</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white/80 backdrop-blur-md border-t border-emerald-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-6 md:mb-0">
              <div className="w-9 h-9 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">StartupMentor</span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Contact
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            © 2025 StartupMentor. All rights reserved. Empowering smarter entrepreneurship & investment.
          </div>
        </div>
      </footer>
    </div>
  )
}
