import {
  type ContractEventName,
  ethers,
  Interface,
  InterfaceAbi,
} from "https://esm.sh/ethers@6.6.2";
import {
  AbiType,
  type ContractResponse,
  type PossibleEvents,
  type XRC20Approval,
  type XRC20Transfer,
  type XRC721Approval,
  type XRC721ApprovalForAll,
  type XRC721Transfer,
} from "./types.ts";
import { DEFAULT_ABI_XRC20, DEFAULT_ABI_XRC721 } from "./misc.ts";

export const getAbi = async (
  address: string,
  type: AbiType,
): Promise<ContractResponse | { [k: string]: unknown }[]> => {
  const contractData = await fetch(
    `https://xdc.blocksscan.io/api/contracts/${address}`,
  );

  if (!contractData.ok) {
    return [DEFAULT_ABI_XRC20, DEFAULT_ABI_XRC721][type];
  }
  return await contractData.json();
};

export const handler = (
  event: ContractEventName,
  [first, second, third]: string[],
  isXrc20: boolean,
): PossibleEvents | null => {
  if (typeof event !== "string") {
    return null;
  }

  switch (event.toLowerCase()) {
    case "transfer": {
      return isXrc20
        ? ({
          from: first,
          to: second,
          value: third,
        }) satisfies XRC20Transfer
        : ({
          from: first,
          to: second,
          tokenId: third,
        }) satisfies XRC721Transfer;
    }
    case "approval": {
      return isXrc20
        ? ({
          event,
          args: {
            owner: first,
            spender: second,
            value: +third,
          },
        }) satisfies XRC20Approval
        : ({
          event,
          args: {
            owner: first,
            approved: second,
            tokenId: third,
          },
        } satisfies XRC721Approval);
    }
    case "approvalforall": {
      return ({
        event,
        args: {
          owner: first,
          operator: second,
          approved: !!third,
        },
      } satisfies XRC721ApprovalForAll);
    }
    default: {
      return null;
    }
  }
};

export const getEventArguments = (
  contractABI: string[],
  eventName: ContractEventName,
): string[] => {
  const iface = new ethers.Interface(contractABI);
  const event = iface.getEvent(eventName.toString());

  if (!event) {
    throw new Error(`Event '${eventName}' not found in ABI`);
  }

  return event.inputs.map(({ name }) => name);
};

const isContract = (c: unknown): c is ContractResponse =>
  typeof c === "object" && c !== null && "abiCode" in c;

export const filterAbi = (
  data: ContractResponse | { [k: string]: unknown }[],
): Interface | InterfaceAbi => {
  if (isContract(data)) {
    return JSON.parse(data.abiCode);
  }
  return data as unknown as (Interface | InterfaceAbi);
};
