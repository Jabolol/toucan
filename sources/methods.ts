import { type ContractEventName, ethers } from "ethers";
import { filterAbi, getAbi, handler } from "./utils.ts";
import { AbiType } from "./types.ts";

const provider = new ethers.JsonRpcProvider("https://erpc.xinfin.network/");

export const getBlockNumber = async () => await provider.getBlockNumber();

export const follow = async (
  address: string,
  type: AbiType,
  events: ContractEventName[],
) => {
  const abi = filterAbi(await getAbi(address, type));
  const contract = new ethers.Contract(
    address.replace(/^xdc/, "0x"),
    abi,
    provider,
  );

  (events.indexOf("all") > -1
    ? ["Transfer", "Approval", "ApprovalForAll"]
    : events).forEach((name) => {
      contract.on(name, (...args) => {
        handler(name, args, type === AbiType.XRC_20);
      });
    });
};

export const unfollow = async (
  address: string,
  type: AbiType,
  events: ContractEventName[] | ["all"],
) => {
  const abi = filterAbi(await getAbi(address, type));
  const contract = new ethers.Contract(
    address.replace(/^xdc/, "0x"),
    abi,
    provider,
  );

  events.forEach((event) =>
    contract.removeAllListeners(event === "all" ? undefined : event)
  );
};

export const getPastEvents = async (
  address: string,
  type: AbiType,
  events: ContractEventName[],
  days: number,
) => {
  const abi = filterAbi(await getAbi(address, type));
  const contract = new ethers.Contract(
    address.replace(/^xdc/, "0x"),
    abi,
    provider,
  );
  const pastEventPromises = events.map(async (eventName) => {
    const fromBlock = (await provider.getBlockNumber()) - (days * 86400) / 15;
    const toBlock = await provider.getBlockNumber();

    return await contract.queryFilter(eventName, fromBlock, toBlock);
  });

  return ((await Promise.all(pastEventPromises)).flatMap((k) => k));
};
