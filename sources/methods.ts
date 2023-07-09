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

if (import.meta.main) {
  // TODO(jabolo): remove this, used to check testnet events
  // await follow("xdc8dA38026f5bB57D20485299903858092AD9C9fBA", ["Transfer"]);

  const type: AbiType = AbiType.XRC_721;
  const address = "xdc85d216d87C993c250A7725aF8f6C161d0504c32B";
  const days = 365;
  const events = [["Transfer", "Approval"], [
    "Transfer",
    "Approval",
    "ApprovalForAll",
  ]][type];

  const data = await getPastEvents(address, type, events, days);

  console.log(data.length);

  await Deno.writeFile(
    `out_${["20", "721"][type]}.json`,
    new TextEncoder().encode(JSON.stringify(data, null, 2)),
  );
}
