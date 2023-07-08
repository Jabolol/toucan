import {
  type CreateMessage,
  type DiscordInteraction,
  type DiscordInteractionResponse,
} from "discordeno";
import { emojis, format } from "./misc.ts";
import {
  AbiType,
  type ContractConfig,
  EventTypes,
  type GuildConfig,
  NFTResponse,
} from "./types.ts";
import { getPastEvents } from "./methods.ts";
import { poll } from "./utils.ts";

export const kv = await Deno.openKv();

export const commands = new Proxy<{
  [k: string]: (
    i: DiscordInteraction,
  ) =>
    | DiscordInteractionResponse["data"]
    | Promise<DiscordInteractionResponse["data"]>;
}>(
  {
    hello: async () => {
      const data = await poll();

      for (const { guild_id, watching } of data) {
        for (const { address, channel_id, events } of watching) {
          const history = await getPastEvents(
            address,
            events.includes(EventTypes.ApprovalForAll)
              ? AbiType.XRC_721
              : AbiType.XRC_20,
            events.includes(EventTypes.All)
              ? ["Transfer", "Approval", "ApprovalForAll"]
              : events.map((x) =>
                ["Transfer", "Approval", "ApprovalForAll"][x]
              ),
            300 / 86400,
          );
          // TODO(jabolo): filter if any event has happened here
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
                  content: emojis.check +
                    ` Sent to ${guild_id}\n\`\`\`json\n${
                      JSON.stringify(history, null, 2)
                    }\`\`\``,
                } satisfies CreateMessage,
              ),
            },
          );
        }
      }

      return { content: `${emojis.check} Sent correctly.` };
    },
    follow: async ({ data, channel_id, guild_id }) => {
      const [action, address] = data?.options!;

      if (!guild_id || !channel_id) {
        return {
          content: `${emojis.refresh} You can't run this on direct messages`,
        };
      }

      if ((<string> address.value).indexOf("xdc") !== 0) {
        return {
          content: emojis.refresh + format` Adresses must start with ${"xdc"}!`,
        };
      }

      const { value: config } = await kv.get<ContractConfig>([
        "address",
        <string> address.value,
      ]);

      if (
        config &&
        config.subs.some((d) =>
          d.guild_id === guild_id && d.channel_id === channel_id
        )
      ) {
        return {
          content: emojis.danger +
            format` You are already following this address!`,
        };
      }

      const configPayload: ContractConfig["subs"][number] = {
        guild_id,
        channel_id,
        events: [<EventTypes> +<string> action.value],
        updatedAt: new Date(),
      };

      const { ok: configOk } = await kv.set(
        ["address", <string> address.value],
        {
          address: config?.address || <string> address.value,
          subs: config?.subs
            ? [...config.subs, configPayload]
            : [configPayload],
        } satisfies ContractConfig,
      );

      if (!configOk) {
        return {
          content: emojis.danger + format` Couldn't save the ${config}`,
        };
      }

      const { value: guild } = await kv.get<GuildConfig>(["guild", guild_id]);

      const guildPayload: GuildConfig["watching"][number] = {
        updatedAt: new Date(),
        address: <string> address.value,
        channel_id,
        events: [<EventTypes> +<string> action.value],
      };

      const { ok: guildOk } = await kv.set(
        ["guild", guild_id],
        {
          guild_id,
          watching: guild?.watching
            ? [...guild.watching, guildPayload]
            : [guildPayload],
        } satisfies GuildConfig,
      );

      if (!guildOk) {
        return {
          content: `${emojis.danger} Couldn't save the config`,
        };
      }

      return {
        content: emojis.check + format` Now following ${
          [
            "transfer",
            "approval",
            "approval_for_all",
            "all",
          ][+<string> action.value]
        } actions for ${address.value}`,
      };
    },
    unfollow: async ({ data, guild_id, channel_id }) => {
      const [address] = data?.options!;

      if (!guild_id || !channel_id) {
        return {
          content: `${emojis.refresh} You can't run this on direct messages`,
        };
      }

      if ((<string> address.value).indexOf("xdc") !== 0) {
        return {
          content: emojis.refresh + `Adresses must start with ${"xdc"}!`,
        };
      }

      const { value } = await kv.get<ContractConfig>([
        "address",
        <string> address.value,
      ]);

      const { value: guild } = await kv.get<GuildConfig>(["guild", guild_id]);

      if (
        !value ||
        !guild ||
        !value.subs.some((data) => data.guild_id === guild_id) ||
        !guild.watching.length
      ) {
        return {
          content: emojis.danger +
            format` You are not following ${address.value}!`,
        };
      }

      const { ok: guildOk } = await kv.set(
        ["guild", guild_id],
        {
          ...guild,
          watching: guild.watching.filter((data) =>
            data.channel_id !== channel_id
          ),
        } satisfies GuildConfig,
      );

      const { ok } = await kv.set(["address", <string> address.value], {
        ...value,
        subs: value.subs.filter((data) => data.guild_id !== guild_id),
      });

      if (!ok || !guildOk) {
        return {
          content: emojis.cross + format` Couldn't save the config, ok: ${ok}`,
        };
      }

      return {
        content: emojis.check + format` Stopped following ${address.value}`,
      };
    },
    config: async ({ data, guild_id }) => {
      const [
        {
          options: [{ name, options: options, value: _value }] = [{
            name: "unknown",
            options: [],
            value: "unknown",
          }],
        },
      ] = data?.options!;

      if (!guild_id) {
        return {
          content: `${emojis.refresh} You can't run this on direct messages`,
        };
      }

      switch (name) {
        case "list": {
          const { value } = await kv.get<GuildConfig>(["guild", guild_id]);
          if (!value) {
            return {
              content: `${emojis.cross} There is not any data yet!`,
            };
          }
          const icons = [
            emojis.members,
            emojis.check,
            emojis.owner,
            emojis.boost,
          ];
          const data = value.watching.map((v) =>
            `${
              v.events.sort((a, b) => a - b).map((x) => icons[x]).join("")
            } <#${v.channel_id}> follows \`${v.address}\` since <t:${
              ((new Date(v.updatedAt)).getTime() / 1000).toFixed()
            }:D>`
          ).join("\n");
          return {
            content: `# Events followed by server \`${guild_id}\`\n${data}`,
          };
        }
        case "remove":
        case "add": {
          const [event, address] = options!;

          if ((<string> address.value).indexOf("xdc") !== 0) {
            return {
              content: emojis.refresh +
                format` Adresses must start with ${"xdc"}!`,
            };
          }

          const { value: guild } = await kv.get<GuildConfig>([
            "guild",
            guild_id,
          ]);
          const { value } = await kv.get<ContractConfig>([
            "address",
            <string> address.value,
          ]);

          if (
            !guild || !value || !guild.watching.length || !value.subs.length
          ) {
            return {
              content: emojis.danger +
                format` You are not following ${address.value}!`,
            };
          }

          const { ok: guildOk } = await kv.set(
            ["guild", guild_id],
            {
              ...guild,
              watching: guild.watching.map((data) =>
                guild.guild_id === guild_id
                  ? {
                    ...data,
                    events: name === "add"
                      ? [
                        ...new Set([...data.events, +<string> event.value]),
                      ]
                      : data.events.filter((d) => d !== +<string> event.value),
                  }
                  : data
              ),
            } satisfies GuildConfig,
          );

          const { ok: configOk } = await kv.set(
            ["address", <string> address.value],
            {
              ...value,
              subs: value.subs.map((data) =>
                data.guild_id === guild_id
                  ? {
                    ...data,
                    events: name === "add"
                      ? [
                        ...new Set([...data.events, +<string> event.value]),
                      ]
                      : data.events.filter((d) => d !== +<string> event.value),
                  }
                  : data
              ),
            } satisfies ContractConfig,
          );

          if (!guildOk || !configOk) {
            return {
              content: emojis.cross +
                format` Couldn't save the config, ok: ${guildOk || !guildOk}`,
            };
          }

          return {
            content: `${emojis.check} Everything updated!`,
          };
        }
        default: {
          return {
            content: emojis.cross + format` ${name} is not a valid subcommand.`,
          };
        }
      }
    },
    plot: ({ data }) => {
      const [
        { value: days },
        { value: type },
        { value: address },
      ] = data?.options!;

      if ((<string> address).indexOf("xdc") !== 0) {
        return {
          content: emojis.refresh + format` Adresses must start with ${"xdc"}!`,
        };
      }

      return {
        embeds: [
          {
            color: 3092790,
            image: {
              url: `${
                Deno.env.get("TOUCAN_URL")
              }/chart?address=${address}&type=${type}&days=${days}`,
            },
            description: `> \`${
              ["XRC21", "XRC721"][<number> type]
            }\` event count over \`${days}\` days\n\`\`\`fix\n${address}\n\`\`\``,
            url: `https://xdc.blocksscan.io/address/${address}`,
            title: `Data visualization`,
          },
        ],
      };
    },
    export: async ({ data }) => {
      const [
        { value: days },
        { value: address },
      ] = data?.options!;

      if (<number> days <= 0) {
        return {
          content: emojis.refresh + format` Days must be greater than ${0}!`,
        };
      }

      const raw = await getPastEvents(<string> address, AbiType.XRC_20, [
        "Transfer",
        "Approval",
      ], <number> days);

      const res = await fetch("https://pastebin.com/api/api_post.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          api_dev_key: Deno.env.get("PASTEBIN_API_KEY")!,
          api_option: "paste",
          api_paste_code: JSON.stringify(raw),
        }),
      });

      if (!res.ok) {
        return {
          content: emojis.cross +
            format` Something went wrong: ${res.statusText}`,
        };
      }

      return {
        content: `${emojis.check} Here's your data: <${await res.text()}>`,
      };
    },
    nft: async ({ data }) => {
      const [{ value: token_id }, { value: address }] = data?.options!;
      const req = await fetch(
        `https://xdc.blocksscan.io/api/tokens/${address}/tokenID/${token_id}`,
      );

      if (!req.ok) {
        return { content: emojis.cross + ` Failed to get the ${"info"}!` };
      }

      const metadata = await req.json() as NFTResponse;

      return {
        embeds: [
          {
            title: `${metadata.tokenName}`,
            url: metadata.tokenData.TokenURIInfo,
            description: `\n\`\`\`ini\n${metadata.tokenData.description}\`\`\``,
            thumbnail: {
              url: metadata.tokenData.image_thumbnail,
            },
            color: 3092790,
            [metadata.tokenData.image.includes("mp4") ? "video" : "image"]: {
              url: metadata.tokenData.image,
            },
          },
        ],
      };
    },
  },
  {
    get(target, prop, receiver) {
      if (!(prop in target)) {
        return ({ data }: DiscordInteraction) => ({
          content: emojis.refresh +
            format`${data?.name} is not a valid command!`,
        });
      }
      return Reflect.get(target, prop, receiver);
    },
  },
);
