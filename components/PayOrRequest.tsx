"use client";

import { useSendTransaction } from "wagmi";
import { parseEther } from "viem";
import { config } from "@/config";

export default function PayOrRequest() {
  const { sendTransaction } = useSendTransaction({ config });

  return (
    <button
      onClick={() =>
        sendTransaction({
          to: "0xd2135CfB216b74109775236E36d4b433F1DF507B",
          value: parseEther("0.01"),
        })
      }
    >
      Send transaction
    </button>
  );
}
