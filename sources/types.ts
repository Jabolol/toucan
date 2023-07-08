import { type ContractEventName } from "https://esm.sh/ethers@6.6.2";

export type ContractResponse = {
  _id: string;
  hash: string;
  abiCode: string;
  bytecode: string;
  compiler: string;
  contractName: string;
  createdAt: string;
  functionHashes: { [k: string]: string };
  opcodes: null;
  optimization: boolean;
  sourceCode: string;
  sourceMap: string;
  txCount: number;
  updatedAt: string;
};

export type EventData = {
  event: ContractEventName;
  data: string[];
  additionaldata?: string;
};

export enum EventTypes {
  Transfer,
  Approval,
  ApprovalForAll,
  All,
}

export enum AbiType {
  XRC_20,
  XRC_721,
}

type DiscordInfo = {
  updatedAt: Date;
  guild_id: string;
  channel_id: string;
  events: EventTypes[];
};

export type ContractConfig = {
  address: string;
  subs: DiscordInfo[];
};

type AddressMeta = {
  updatedAt: Date;
  address: string;
  channel_id: string;
  events: EventTypes[];
};

export type GuildConfig = {
  guild_id: string;
  watching: AddressMeta[];
};

export type XRC20Transfer = {
  from: string;
  to: string;
  value: string;
};

export type XRC721Transfer = {
  from: string;
  to: string;
  tokenId: string;
};

export type XRC20Approval = {
  event: ContractEventName;
  args: {
    owner: string;
    spender: string;
    value: number;
  };
};

export type XRC721Approval = {
  event: ContractEventName;
  args: {
    owner: string;
    approved: string;
    tokenId: string;
  };
};

export type XRC721ApprovalForAll = {
  event: ContractEventName;
  args: {
    owner: string;
    operator: string;
    approved: boolean;
  };
};

export type PossibleEvents =
  | XRC20Transfer
  | EventData
  | XRC721Transfer
  | XRC20Approval
  | XRC721Approval
  | XRC721ApprovalForAll;

export type ContractEvent = {
  provider: never;
  transactionHash: string;
  blockHash: string;
  blockNumber: number;
  removed: boolean;
  address: string;
  data: string;
  topics: [string, string, string];
  index: number;
  transactionIndex: number;
  interface: {
    fragments: {
      type: string;
      inputs: {
        type: string;
        inputs: {
          name: string;
          type: string;
          baseType: string;
          indexed: boolean;
          components: unknown;
          arrayLength: unknown;
          arrayChildren: unknown;
        }[];
        name: string;
        anonymous?: boolean;
        constant?: boolean;
        outputs?: unknown;
        stateMutability?: string;
        payable?: boolean;
        gas: unknown;
      }[];
      name: string;
      anonymous?: boolean;
      constant?: boolean;
      outputs?: unknown;
      stateMutability?: string;
      payable?: boolean;
      gas: unknown;
    }[];
    deploy: {
      type: string;
      inputs: unknown;
      payable: boolean;
      gas: unknown;
    };
    fallback: unknown;
    receive: boolean;
  };
  fragment: {
    type: string;
    inputs: {
      name: string;
      type: string;
      baseType: string;
      indexed: boolean;
      components: unknown;
      arrayLength: unknown;
      arrayChildren: unknown;
    }[];
    name: string;
    anonymous: boolean;
  };
  args: [string, string, number];
};
