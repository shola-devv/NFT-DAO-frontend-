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

  const nftBalanceOfUser : any = useContractRead({
    abi: CryptoDevsNFTABI,
    address: CryptoDevsNFTAddress,
    functionName: "balanceOf",
    args: [address],
  });

  async function createProposal(): Promise<void> {
    if (!address) {
      window.alert("Please connect your wallet");
      return;
    }
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
      if (!numOfProposalsInDAO?.data) return [];
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
    if (!address) {
      window.alert("Please connect your wallet");
      return;
    }
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
    if (!address) {
      window.alert("Please connect your wallet");
      return;
    }
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
    if (!address) {
      window.alert("Please connect your wallet");
      return;
    }
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
            className="border border-gray-300 rounded-full px-3 py-2 w-48 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 shadow-[inset_2px_2px_5px_#d1d1d1,inset_-2px_-2px_5px_#ffffff]"
          />
          <button
            className="bg-gray-200 text-gray-800 font-semibold px-4 py-2 rounded-full shadow-[5px_5px_10px_#d1d1d1,-5px_-5px_10px_#ffffff] hover:shadow-[inset_2px_2px_5px_#d1d1d1,inset_-2px_-2px_5px_#ffffff] transition-all"
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
              <div key={index} className="bg-gray-100 rounded-lg p-4 shadow-[5px_5px_10px_#d1d1d1,-5px_-5px_10px_#ffffff]">
              <p className="text-sm">Proposal ID: {p.proposalId}</p>
              <p className="text-sm">Fake NFT to Purchase: {p.nftTokenId}</p>
              <p className="text-sm">Deadline: {p.deadline.toLocaleString()}</p>
              <p className="text-sm">Yay Votes: {p.yayVotes}</p>
              <p className="text-sm">Nay Votes: {p.nayVotes}</p>
              <p className="text-sm">Executed?: {p.executed.toString()}</p>
              {p.deadline.getTime() > Date.now() && !p.executed ? (
                <div className="flex gap-2 mt-3">
                  <button
                    className="bg-green-200 text-green-800 font-semibold px-4 py-2 rounded-full shadow-[5px_5px_10px_#d1d1d1,-5px_-5px_10px_#ffffff] hover:shadow-[inset_2px_2px_5px_#d1d1d1,inset_-2px_-2px_5px_#ffffff] transition-all"
                    onClick={() => voteForProposal(p.proposalId, "YAY")}
                  >
                    Vote YAY
                  </button>
                  <button
                    className="bg-red-200 text-red-800 font-semibold px-4 py-2 rounded-full shadow-[5px_5px_10px_#d1d1d1,-5px_-5px_10px_#ffffff] hover:shadow-[inset_2px_2px_5px_#d1d1d1,inset_-2px_-2px_5px_#ffffff] transition-all"
                    onClick={() => voteForProposal(p.proposalId, "NAY")}
                  >
                    Vote NAY
                  </button>
                </div>
              ) : p.deadline.getTime() < Date.now() && !p.executed ? (
                <div className="flex mt-3">
                  <button
                    className="bg-blue-200 text-blue-800 font-semibold px-4 py-2 rounded-full shadow-[5px_5px_10px_#d1d1d1,-5px_-5px_10px_#ffffff] hover:shadow-[inset_2px_2px_5px_#d1d1d1,inset_-2px_-2px_5px_#ffffff] transition-all"
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
       
        {address ? (<div className="flex flex-col gap-4 text-center">
         <h1 className="text-4xl font-bold">Welcome to Crypto Devs!</h1>
          <div className="text-gray-600">Welcome to the DAO!</div>
          <div className="text-gray-600 leading-relaxed">
            Your CryptoDevs NFT Balance: {nftBalanceOfUser?.data?.toString()}
            <br />
            {daoBalance.data && (
              <>
                Treasury Balance:{" "}
                {formatEther(daoBalance?.data.value).toString()} ETH
              </>
            )}
            <br />
            Total Number of Proposals: {numOfProposalsInDAO?.data?.toString()}
          </div>
          <div className="flex gap-3 mt-2 justify-center">
            <button
              className="bg-gray-200 text-gray-800 font-semibold px-5 py-2 rounded-full shadow-[5px_5px_10px_#d1d1d1,-5px_-5px_10px_#ffffff] hover:shadow-[inset_2px_2px_5px_#d1d1d1,inset_-2px_-2px_5px_#ffffff] transition-all"
              onClick={() => setSelectedTab("Create Proposal")}
            >
              Create Proposal
            </button>
            <button
              className="bg-gray-200 text-gray-800 font-semibold px-5 py-2 rounded-full shadow-[5px_5px_10px_#d1d1d1,-5px_-5px_10px_#ffffff] hover:shadow-[inset_2px_2px_5px_#d1d1d1,inset_-2px_-2px_5px_#ffffff] transition-all"
              onClick={() => setSelectedTab("View Proposals")}
            >
              View Proposals
            </button>
          </div>
          {renderTabs()}
          {address && daoOwner?.data && address.toLowerCase() === daoOwner.data.toLowerCase() ? (
            <div className="mt-4">
              {loading ? (
                <button className="bg-gray-300 text-gray-600 font-semibold px-5 py-2 rounded-full shadow-[inset_2px_2px_5px_#d1d1d1,inset_-2px_-2px_5px_#ffffff] cursor-not-allowed">
                  Loading...
                </button>
              ) : (
                <button
                  className="bg-red-200 text-red-800 font-semibold px-5 py-2 rounded-full shadow-[5px_5px_10px_#d1d1d1,-5px_-5px_10px_#ffffff] hover:shadow-[inset_2px_2px_5px_#d1d1d1,inset_-2px_-2px_5px_#ffffff] transition-all"
                  onClick={withdrawDAOEther}
                >
                  Withdraw DAO ETH
                </button>
              )}
            </div>
          ) : (
           <div className="flex justify-center items-center min-h-screen">
        <ConnectButton />
      </div>
          )}
        </div>
      ) : ""}
      </div>
    </div>
  );
}