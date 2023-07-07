import {
  type DiscordInteraction,
  type DiscordInteractionResponse,
} from "discordeno";
import { emojis, format } from "./misc.ts";
import { type ContractConfig, EventTypes, type GuildConfig } from "./types.ts";

const kv = await Deno.openKv();

export const commands = new Proxy<{
  [k: string]: (
    i: DiscordInteraction,
  ) =>
    | DiscordInteractionResponse["data"]
    | Promise<DiscordInteractionResponse["data"]>;
}>(
  {
    hello: async ({ guild_id, channel_id, data }) => {
      const [name] = data?.options!;

      if (!guild_id || !channel_id) {
        return {
          content: `${emojis.refresh} You can't run this on direct messages`,
        };
      }

      const { value, versionstamp } = await kv.get<ContractConfig>([
        `config:${guild_id}`,
        channel_id!,
      ]);

      const { ok } = await kv.set(
        [`config:${guild_id}`, channel_id!],
        {
          address: value?.address || "example",
          subs: value?.subs || [{
            guild_id,
            channel_id,
            events: [EventTypes.Transfer],
            updatedAt: new Date(),
          }],
        } satisfies ContractConfig,
      );

      if (!ok) {
        return {
          content: emojis.danger + format` Couldn't save the config, ok: ${ok}`,
        };
      }

      return {
        content:
          `${emojis.bot} Hi ${name.value} -> \`${versionstamp}\`\n\`\`\`json\n${
            JSON.stringify(value, null, 2)
          }\`\`\``,
      };
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
          content: emojis.refresh + format`Adresses must start with ${"xdc"}!`,
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
          return {
            content: `\`\`\`json\n${JSON.stringify(value, null, 2)}\`\`\``,
          };
        }
        case "remove":
        case "add": {
          const [event, address] = options!;

          if ((<string> address.value).indexOf("xdc") !== 0) {
            return {
              content: emojis.refresh +
                format`Adresses must start with ${"xdc"}!`,
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
