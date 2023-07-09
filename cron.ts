import "$std/dotenv/load.ts";
import { CreateMessage } from "discordeno";
import { getPastEvents } from "./sources/methods.ts";
import { EventTypes,AbiType } from "./sources/types.ts";
import { poll } from "./sources/utils.ts";

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
      300 / 86400,
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
              content: `${JSON.stringify(history, null, 2)}\`\`\``,
            } satisfies CreateMessage,
          ),
        },
      );
    }
  }
}
