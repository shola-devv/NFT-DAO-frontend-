'use client'

import {
  CryptoDevsDAOABI,
  CryptoDevsDAOAddress,
  CryptoDevsNFTABI,
  CryptoDevsNFTAddress,
} from "@/constants";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Head from "next/head";
import { useEffect, useState } from "react";
import { formatEther } from "viem/utils";
import { useAccount, useBalance, useContractRead } from "wagmi";
import { readContract, waitForTransaction, writeContract } from "wagmi/actions";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

interface Proposal {
  proposalId: number;
  nftTokenId: string;
  deadline: Date;
  yayVotes: string;
  nayVotes: string;
  executed: boolean;
}

export default function Home(): JSX.Element | null {
  const { address, isConnected } = useAccount();

  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [fakeNftTokenId, setFakeNftTokenId] = useState<string>("");
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>("");

  const daoOwner = useContractRead({
    abi: CryptoDevsDAOABI,
    address: CryptoDevsDAOAddress,
    functionName: "owner",
  });

  const daoBalance = useBalance({
    address: CryptoDevsDAOAddress,
  });

  const numOfProposalsInDAO = useContractRead({
    abi: CryptoDevsDAOABI,
    address: CryptoDevsDAOAddress,
    functionName: "numProposals",
  });

  const nftBalanceOfUser = useContractRead({
    abi: CryptoDevsNFTABI,
    address: CryptoDevsNFTAddress,
    functionName: "balanceOf",
    args: [address],
  });

  async function createProposal(): Promise<void> {
    setLoading(true);
    try {
      const tx = await writeContract({
        address: CryptoDevsDAOAddress,
        abi: CryptoDevsDAOABI,
        functionName: "createProposal",
        args: [fakeNftTokenId],
      });
      await waitForTransaction(tx);
    } catch (error) {
      console.error(error);
      window.alert(error);
    }
    setLoading(false);
  }

  async function fetchProposalById(id: number): Promise<Proposal | undefined> {
    try {
      const proposal = await readContract({
        address: CryptoDevsDAOAddress,
        abi: CryptoDevsDAOABI,
        functionName: "proposals",
        args: [id],
      });

      const [nftTokenId, deadline, yayVotes, nayVotes, executed] = proposal as [
        bigint,
        bigint,
        bigint,
        bigint,
        boolean
      ];

      return {
        proposalId: id,
        nftTokenId: nftTokenId.toString(),
        deadline: new Date(parseInt(deadline.toString()) * 1000),
        yayVotes: yayVotes.toString(),
        nayVotes: nayVotes.toString(),
        executed: Boolean(executed),
      };
    } catch (error) {
      console.error(error);
      window.alert(error);
    }
  }

  async function fetchAllProposals(): Promise<Proposal[] | undefined> {
    try {
      const proposals: Proposal[] = [];
      for (let i = 0; i < numOfProposalsInDAO.data; i++) {
        const proposal = await fetchProposalById(i);
        proposals.push(proposal!);
      }
      setProposals(proposals);
      return proposals;
    } catch (error) {
      console.error(error);
      window.alert(error);
    }
  }

  async function voteForProposal(proposalId: number, vote: "YAY" | "NAY"): Promise<void> {
    setLoading(true);
    try {
      const tx = await writeContract({
        address: CryptoDevsDAOAddress,
        abi: CryptoDevsDAOABI,
        functionName: "voteOnProposal",
        args: [proposalId, vote === "YAY" ? 0 : 1],
      });
      await waitForTransaction(tx);
    } catch (error) {
      console.error(error);
      window.alert(error);
    }
    setLoading(false);
  }

  async function executeProposal(proposalId: number): Promise<void> {
    setLoading(true);
    try {
      const tx = await writeContract({
        address: CryptoDevsDAOAddress,
        abi: CryptoDevsDAOABI,
        functionName: "executeProposal",
        args: [proposalId],
      });
      await waitForTransaction(tx);
    } catch (error) {
      console.error(error);
      window.alert(error);
    }
    setLoading(false);
  }

  async function withdrawDAOEther(): Promise<void> {
    setLoading(true);
    try {
      const tx = await writeContract({
        address: CryptoDevsDAOAddress,
        abi: CryptoDevsDAOABI,
        functionName: "withdrawEther",
        args: [],
      });
      await waitForTransaction(tx);
    } catch (error) {
      console.error(error);
      window.alert(error);
    }
    setLoading(false);
  }

  function renderTabs(): JSX.Element | null {
    if (selectedTab === "Create Proposal") return renderCreateProposalTab();
    else if (selectedTab === "View Proposals") return renderViewProposalsTab();
    return null;
  }

  function renderCreateProposalTab(): JSX.Element {
    if (loading) {
      return (
        <div className="text-sm text-gray-600 mt-2">
          Loading... Waiting for transaction...
        </div>
      );
    } else if (nftBalanceOfUser.data === 0) {
      return (
        <div className="text-sm text-gray-600 mt-2">
          You do not own any CryptoDevs NFTs. <br />
          <b>You cannot create or vote on proposals</b>
        </div>
      );
    } else {
      return (
        <div className="flex flex-col gap-2 mt-4">
          <label className="text-sm font-medium">Fake NFT Token ID to Purchase:</label>
          <input
            placeholder="0"
            type="number"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFakeNftTokenId(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded w-fit transition-colors"
            onClick={createProposal}
          >
            Create
          </button>
        </div>
      );
    }
  }

  function renderViewProposalsTab(): JSX.Element {
    if (loading) {
      return (
        <div className="text-sm text-gray-600 mt-2">
          Loading... Waiting for transaction...
        </div>
      );
    } else if (proposals.length === 0) {
      return (
        <div className="text-sm text-gray-600 mt-2">No proposals have been created</div>
      );
    } else {
      return (
        <div className="flex flex-col gap-4 mt-4">
          {proposals.map((p: Proposal, index: number) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 shadow-sm bg-white">
              <p className="text-sm">Proposal ID: {p.proposalId}</p>
              <p className="text-sm">Fake NFT to Purchase: {p.nftTokenId}</p>
              <p className="text-sm">Deadline: {p.deadline.toLocaleString()}</p>
              <p className="text-sm">Yay Votes: {p.yayVotes}</p>
              <p className="text-sm">Nay Votes: {p.nayVotes}</p>
              <p className="text-sm">Executed?: {p.executed.toString()}</p>
              {p.deadline.getTime() > Date.now() && !p.executed ? (
                <div className="flex gap-2 mt-3">
                  <button
                    className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded transition-colors"
                    onClick={() => voteForProposal(p.proposalId, "YAY")}
                  >
                    Vote YAY
                  </button>
                  <button
                    className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded transition-colors"
                    onClick={() => voteForProposal(p.proposalId, "NAY")}
                  >
                    Vote NAY
                  </button>
                </div>
              ) : p.deadline.getTime() < Date.now() && !p.executed ? (
                <div className="flex mt-3">
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded transition-colors"
                    onClick={() => executeProposal(p.proposalId)}
                  >
                    Execute Proposal{" "}
                    {p.yayVotes > p.nayVotes ? "(YAY)" : "(NAY)"}
                  </button>
                </div>
              ) : (
                <div className="text-sm text-gray-500 mt-2">Proposal Executed</div>
              )}
            </div>
          ))}
        </div>
      );
    }
  }

  useEffect(() => {
    if (selectedTab === "View Proposals") {
      fetchAllProposals();
    }
  }, [selectedTab]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  if (!isConnected)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <ConnectButton />
      </div>
    );

  return (
    <div className={inter.className}>
      <Head>
        <title>CryptoDevs DAO</title>
        <meta name="description" content="CryptoDevs DAO" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex justify-between items-start min-h-screen px-8 py-12 max-w-6xl mx-auto">
        <div className="flex flex-col gap-4">
          <h1 className="text-4xl font-bold">Welcome to Crypto Devs!</h1>
          <div className="text-gray-600">Welcome to the DAO!</div>
          <div className="text-gray-600 leading-relaxed">
            Your CryptoDevs NFT Balance: {nftBalanceOfUser.data.toString()}
            <br />
            {daoBalance.data && (
              <>
                Treasury Balance:{" "}
                {formatEther(daoBalance.data.value).toString()} ETH
              </>
            )}
            <br />
            Total Number of Proposals: {numOfProposalsInDAO.data.toString()}
          </div>
          <div className="flex gap-3 mt-2">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded transition-colors"
              onClick={() => setSelectedTab("Create Proposal")}
            >
              Create Proposal
            </button>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded transition-colors"
              onClick={() => setSelectedTab("View Proposals")}
            >
              View Proposals
            </button>
          </div>
          {renderTabs()}
          {address && address.toLowerCase() === (daoOwner.data as string).toLowerCase() ? (
            <div className="mt-4">
              {loading ? (
                <button className="bg-gray-400 text-white font-semibold px-5 py-2 rounded cursor-not-allowed">
                  Loading...
                </button>
              ) : (
                <button
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2 rounded transition-colors"
                  onClick={withdrawDAOEther}
                >
                  Withdraw DAO ETH
                </button>
              )}
            </div>
          ) : (
            ""
          )}
        </div>
        <div>
          <img className="w-64 h-auto rounded-lg" src="https://i.imgur.com/buNhbF7.png" />
        </div>
      </div>
    </div>
  );
}