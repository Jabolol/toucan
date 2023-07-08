import {
  type ContractEventName,
  ethers,
  Interface,
  InterfaceAbi,
} from "ethers";
import { ChartColors, transparentize } from "$fresh_charts/utils.ts";
import { chart as makeChart } from "$fresh_charts/core.ts";
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
import { DEFAULT_ABI_XRC20, DEFAULT_ABI_XRC721, json } from "./misc.ts";
import { getPastEvents } from "./methods.ts";
import { render } from "resvg";
import { type XmlElement } from "json2xml";

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

export const calculateOffsetInDays = (blockNumbers: number[]): number[] => {
  const minBlockNumber = Math.min(...blockNumbers);

  return blockNumbers.map((blockNumber) => {
    const differenceInBlocks = blockNumber - minBlockNumber;
    const differenceInSeconds = differenceInBlocks * 15;
    const offsetInDays = Math.round(differenceInSeconds / 86400);
    return offsetInDays;
  });
};

const countOccurrences = (array: number[], days: number): number[] => {
  const counts: { [k: number]: number } = {};

  array.forEach((element) => {
    counts[element] = (counts[element] || 0) + 1;
  });

  const minElement = Math.min(...array);
  const occurrences: number[] = [];

  for (let i = minElement; i <= days; i++) {
    occurrences.push(counts[i] || 0);
  }

  return occurrences;
};

export const createChart = (
  data: (ethers.Log | ethers.EventLog)[],
  days: number,
) => {
  const blockDays = calculateOffsetInDays(
    data.map(({ blockNumber }) => blockNumber),
  );

  return render(makeChart({
    type: "line",
    data: {
      labels: Array.from({ length: days }, (_, i) => "" + (i + 1)),
      datasets: [
        {
          label: "Contract Events",
          data: countOccurrences(blockDays, days).map((x) => "" + x),
          borderColor: ChartColors.Blue,
          backgroundColor: transparentize(ChartColors.Blue, 0.5),
          borderWidth: 1,
        },
      ],
    },
    options: {
      devicePixelRatio: 1,
    },
  }));
};

export const chart = async (url: URL) => {
  const { address, type, days } = Object.fromEntries(
    url.searchParams,
  ) as Partial<{
    address: string;
    type: string;
    days: string;
  }>;

  if (!address || address.length !== 43 || address.indexOf("xdc") !== 0) {
    return json({ error: "Invalid address" }, { status: 400 });
  }

  if (!type || isNaN(+type) || !(+type in [0, 1])) {
    return json({ error: "Invalid type" }, { status: 400 });
  }

  if (!days || isNaN(+days) || +days < 0 || +days > 365 * 3) {
    return json({ error: "Invalid days" }, { status: 400 });
  }

  return new Response(
    await createChart(
      await getPastEvents(
        address,
        +type,
        [["Transfer", "Approval"], [
          "Transfer",
          "Approval",
          "ApprovalForAll",
        ]][+type],
        +days,
      ),
      +days,
    ),
    {
      headers: { "Content-Type": "image/png" },
    },
  );
};

export const convertToXmlElement = <T extends { [key: string]: unknown }>(
  obj: T,
  elementName: string,
): XmlElement => {
  const element: XmlElement = {
    _name: elementName,
    _attrs: {},
    _content: [],
  };

  if (!obj) return element;

  Object.entries(obj).forEach(([key, value]) => {
    if (typeof value === "object") {
      if (Array.isArray(value)) {
        const childElements = value.map((item) =>
          convertToXmlElement(item, key)
        );
        (<XmlElement[]> element._content).push(...childElements);
      } else {
        const childElement = convertToXmlElement(
          <{ [k: string]: unknown }> value!,
          key,
        );
        (<XmlElement[]> element._content).push(childElement);
      }
    } else {
      (<{ [k: string]: unknown }> element._attrs)[key] = value;
    }
  });

  return element;
};
