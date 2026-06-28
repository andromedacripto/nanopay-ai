"use client";

import { motion } from "framer-motion";
import { Zap, Shield, Globe } from "lucide-react";

export default function HeroSection() {
  return (
    <div className="text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-blue/20 bg-brand-blue/5 px-4 py-1.5 text-xs font-semibold text-brand-blue"
      >
        <Zap className="h-3.5 w-3.5" fill="currentColor" />
        Powered by Arc Network · USDC Nanopayments
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-4 text-4xl font-extrabold tracking-tight text-text-primary sm:text-5xl lg:text-6xl"
      >
        Pay only for the{" "}
        <span className="bg-gradient-brand bg-clip-text text-transparent">
          intelligence
        </span>{" "}
        you use.
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-text-secondary sm:text-lg"
      >
        AI powered by stablecoin micropayments on Arc. Ask anything, pay{" "}
        <span className="font-semibold text-usdc">0.003 USDC</span>, get a
        premium answer — no subscriptions, no accounts.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex flex-wrap items-center justify-center gap-4 text-xs text-text-muted"
      >
        {[
          { icon: Shield, label: "Non-custodial" },
          { icon: Zap, label: "Sub-second settlement" },
          { icon: Globe, label: "Permissionless" },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <Icon className="h-3.5 w-3.5 text-brand-blue" />
            <span>{label}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
