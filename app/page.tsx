"use client";

// import { cookieStorage, createStorage, http } from '@wagmi/core'
import { ConnectButton } from "@/components/ConnectButton";
import { InfoList } from "@/components/InfoList";
import { ActionButtonList } from "@/components/ActionButtonList";
import Image from "next/image";

export default function Home() {
  return (
    <div className={"pages"}>
      <Image
        src="../public/next.svg"
        alt="Reown"
        width={150}
        height={150}
        priority
      />
      <h1>AppKit Wagmi Next.js App Router Example yooooo</h1> <br />
      <ConnectButton /> <br />
      <ActionButtonList /> <br />
      <div className="advice">
        <p>
          This projectId only works on localhost. <br />
          Go to{" "}
          <a
            href="https://cloud.reown.com"
            target="_blank"
            className="link-button"
            rel="Reown Cloud"
          >
            Reown Cloud
          </a>{" "}
          to get your own.
        </p>
      </div>
      <InfoList />
    </div>
  );
}
