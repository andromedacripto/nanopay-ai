"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import QuestionInput from "@/components/QuestionInput";
import PaymentCard from "@/components/PaymentCard";
import LoadingCard from "@/components/LoadingCard";
import AnswerCard from "@/components/AnswerCard";
import NotificationList from "@/components/Notification";
import Footer from "@/components/Footer";
import { useWallet } from "@/hooks/useWallet";
import { useNanoPay } from "@/hooks/useNanoPay";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const [question, setQuestion] = useState("");

  const { walletState, isConnecting, connect, disconnect } = useWallet();

  const {
    step,
    loadingPhase,
    answer,
    transactionHash,
    answerTimestamp,
    error,
    notifications,
    payAndAsk,
    reset,
    dismissNotification,
  } = useNanoPay({ walletAddress: walletState.address });

  const handlePayAndAsk = async () => {
    if (!question.trim()) return;
    await payAndAsk(question);
  };

  const handleAskAnother = () => {
    setQuestion("");
    reset();
  };

  const isLoading =
    step === "payment-pending" ||
    step === "payment-processing" ||
    step === "ai-processing";

  const isCompleted = step === "completed";

  return (
    <>
      <Navbar
        walletState={walletState}
        onConnect={connect}
        onDisconnect={disconnect}
        isConnecting={isConnecting}
      />

      <main className="flex flex-1 flex-col">
        <section className="relative px-4 pb-8 pt-16 sm:px-6 sm:pt-24 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <HeroSection />
          </div>
        </section>

        <section className="flex-1 px-4 pb-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl space-y-5">
            <div
              className={cn(
                "rounded-3xl border bg-background-card p-6 shadow-card transition-all duration-300",
                isCompleted
                  ? "border-success/20"
                  : "border-border hover:border-border-active/30"
              )}
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-text-primary">
                  {isCompleted ? "Answer ready" : "Ask your question"}
                </h2>
                {!isCompleted && (
                  <div className="flex items-center gap-1.5 rounded-full border border-usdc/20 bg-usdc/10 px-3 py-1 text-xs font-medium text-usdc">
                    <div className="h-1.5 w-1.5 rounded-full bg-usdc" />
                    0.003 USDC / question
                  </div>
                )}
              </div>

              {!isLoading && !isCompleted && (
                <div className="mb-5">
                  <QuestionInput
                    value={question}
                    onChange={setQuestion}
                    disabled={isLoading}
                  />
                </div>
              )}

              {isLoading && question && (
                <div className="mb-5 rounded-xl border border-border bg-background-elevated p-4">
                  <p className="text-xs text-text-muted mb-1">Your question</p>
                  <p className="text-sm text-text-secondary line-clamp-3">{question}</p>
                </div>
              )}

              {isLoading && loadingPhase && <LoadingCard phase={loadingPhase} />}

              {isCompleted && answer && (
                <AnswerCard
                  answer={answer}
                  transactionHash={transactionHash}
                  timestamp={answerTimestamp}
                  onAskAnother={handleAskAnother}
                />
              )}

              {!isLoading && !isCompleted && (
                <PaymentCard
                  step={step}
                  question={question}
                  isConnected={walletState.isConnected}
                  onPayAndAsk={handlePayAndAsk}
                  error={error}
                />
              )}
            </div>

            {step === "idle" && (
              <div className="animate-fade-in rounded-2xl border border-border bg-background-card/50 p-5">
                <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-text-muted">
                  How it works
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { step: "1", title: "Connect", desc: "Connect your Web3 wallet with USDC on the Arc network" },
                    { step: "2", title: "Ask", desc: "Type any question and click Pay & Ask" },
                    { step: "3", title: "Receive", desc: "Pay 0.003 USDC and get an AI answer instantly" },
                  ].map(({ step: s, title, desc }) => (
                    <div key={s} className="text-center">
                      <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-brand text-sm font-bold text-white shadow-brand-sm">
                        {s}
                      </div>
                      <p className="mb-1 text-sm font-semibold text-text-primary">{title}</p>
                      <p className="text-xs leading-relaxed text-text-muted">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === "idle" && (
              <div className="animate-fade-in grid grid-cols-3 gap-3">
                {[
                  { value: "0.003", unit: "USDC", label: "Per question" },
                  { value: "<3s", unit: "", label: "Settlement" },
                  { value: "Arc", unit: "", label: "Blockchain" },
                ].map(({ value, unit, label }) => (
                  <div key={label} className="rounded-2xl border border-border bg-background-card p-4 text-center">
                    <p className="text-xl font-bold text-text-primary">
                      {value}
                      {unit && <span className="ml-1 text-sm font-semibold text-usdc">{unit}</span>}
                    </p>
                    <p className="mt-0.5 text-xs text-text-muted">{label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
      <NotificationList notifications={notifications} onDismiss={dismissNotification} />
    </>
  );
}
