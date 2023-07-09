import "$std/dotenv/load.ts";
import { CreateMessage } from "discordeno";
import { getPastEvents } from "./sources/methods.ts";
import { AbiType, EventTypes } from "./sources/types.ts";
import { poll } from "./sources/utils.ts";

const ELAPSED_TIME = 300 / 86400;

export const notify = async () => {
  const data = await poll();

  for (const { watching } of data) {
    for (const { address, channel_id, events } of watching) {
      const history = await getPastEvents(
        address,
        events.includes(EventTypes.ApprovalForAll)
          ? AbiType.XRC_721
          : AbiType.XRC_20,
        events.includes(EventTypes.All)
          ? ["Transfer", "Approval", "ApprovalForAll"]
          : events.map((x) => ["Transfer", "Approval", "ApprovalForAll"][x]),
        ELAPSED_TIME,
      );
      if (history.length) {
        fetch(
          `https://discord.com/api/v10/channels/${channel_id}/messages`,
          {
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bot ${Deno.env.get("DISCORD_TOKEN")}`,
            },
            method: "POST",
            body: JSON.stringify(
              {
                embeds: history.map((x) => ({
                  color: 3092790,
                  url:
                    `https://xdc.blocksscan.io/blocks/${x.blockNumber}#transactions`,
                  title: "Event triggered!",
                  description:
                    `> Address\n\`\`\`md\n${x.address}\n\`\`\`\n> Block hash\n\`\`\`ini\n${x.blockHash}\n\`\`\`\n> Transaction hash\n\`\`\`ini\n${x.transactionHash}\n\`\`\`\n> Topics\n\`\`\`md\n1. ${
                      x.topics[0]
                    }\n2. ${x.topics[1]}\n3. ${x.topics[2]}\n\`\`\``,
                })),
              } satisfies CreateMessage,
            ),
          },
        );
      }
    }
  }
};
