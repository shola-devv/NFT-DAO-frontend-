"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";

export default function Home() {
  const { address, isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="flex h-screen items-center justify-center">
        <ConnectButton />
      </div>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center h-screen gap-4">
      <h1 className="text-2xl font-bold">CryptoDevs DAO</h1>
      <p>Connected: {address}</p>
    </main>
  );
}