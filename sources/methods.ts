import { ethers } from "https://esm.sh/ethers@6.6.2";
import type { ContractEventName } from "https://esm.sh/ethers@6.6.2";
import { getAbi, handler, isXrc20 } from "./utils.ts";

const provider = new ethers.JsonRpcProvider("https://rpc.apothem.network/");

export const getBlockNumber = async () => await provider.getBlockNumber();

export const follow = async (address: string, events: ContractEventName[]) => {
  const abi = await getAbi(address);
  const contract = new ethers.Contract(
    address.replace(/^xdc/, "0x"),
    JSON.parse(abi.abiCode),
    provider,
  );

  (events.indexOf("all") > -1
    ? ["Transfer", "Approval", "ApprovalForAll"]
    : events).forEach((name) => {
      contract.on(name, async (...args) => {
        handler(name, args, await isXrc20(address));
      });
    });
};

export const unfollow = async (
  address: string,
  events: ContractEventName[] | ["all"],
) => {
  const abi = await getAbi(address);
  const contract = new ethers.Contract(
    address,
    JSON.parse(abi.abiCode),
    provider,
  );

  events.forEach((event) =>
    contract.removeAllListeners(event === "all" ? undefined : event)
  );
};

if (import.meta.main) {
  // TODO(jabolo): remove this, used to check testnet events
  await follow("xdc8dA38026f5bB57D20485299903858092AD9C9fBA", ["Transfer"]);
}
