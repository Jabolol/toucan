import nacl from "nacl";
import { rgb24 } from "$std/fmt/colors.ts";
import { type DiscordInteractionResponse } from "discordeno";

const hexToUint8Array = (hex: string) => {
  return new Uint8Array(
    hex.match(/.{1,2}/g)!.map((val) => parseInt(val, 16)),
  );
};

export const verifySignature = async (
  request: Request,
): Promise<{ valid: boolean; body: string }> => {
  const PUBLIC_KEY = Deno.env.get("DISCORD_PUBLIC_KEY")!;
  const signature = request.headers.get("X-Signature-Ed25519")!;
  const timestamp = request.headers.get("X-Signature-Timestamp")!;
  const body = await request.text();
  const valid = nacl.sign.detached.verify(
    new TextEncoder().encode(timestamp + body),
    hexToUint8Array(signature),
    hexToUint8Array(PUBLIC_KEY),
  );

  return { valid, body };
};

export const json = (msg: Record<string, unknown>, init?: ResponseInit) =>
  new Response(JSON.stringify(msg), {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

export const respond = (data: DiscordInteractionResponse["data"]) => {
  return json({ type: 4, data });
};

export const format = (
  strings: TemplateStringsArray,
  ...values: unknown[]
): string =>
  strings.reduce(
    (result, str, i) => `${result}${str}${values[i] ? `\`${values[i]}\`` : ""}`,
    "",
  );

export const emojis = {
  automod: "<:1072automod:1126923617796624494>",
  check: "<:checkmark:1126937899972173944>",
  danger: "<:5165danger:1126923477564280872>",
  cross: "<:crossmark:1126950089525563483>",
  refresh: "<:1158refresh:1126923627607101460>",
  bot: "<:4928applicationbot:1126923610926354553>",
} as const;

export const banner = () => {
  console.log(
    rgb24(
      "\n$$$$$$$$\\                                            $$$$$$$$\\        $$\\                           \n",
      { r: 25, g: 25, b: 112 },
    ) +
      rgb24(
        "\\__$$  __|                                           \\__$$  __|       $$ |                          \n",
        { r: 139, g: 0, b: 139 },
      ) +
      rgb24(
        "   $$ | $$$$$$\\  $$\\   $$\\  $$$$$$$\\ $$$$$$\\  $$$$$$$\\  $$ | $$$$$$\\  $$ |  $$\\  $$$$$$\\  $$$$$$$\\  \n",
        { r: 255, g: 0, b: 255 },
      ) +
      rgb24(
        "   $$ |$$  __$$\\ $$ |  $$ |$$  _____|\\____$$\\ $$  __$$\\ $$ |$$  __$$\\ $$ | $$  |$$  __$$\\ $$  __$$\\ \n",
        { r: 0, g: 255, b: 255 },
      ) +
      rgb24(
        "   $$ |$$ /  $$ |$$ |  $$ |$$ /      $$$$$$$ |$$ |  $$ |$$ |$$ /  $$ |$$$$$$  / $$$$$$$$ |$$ |  $$ |\n",
        { r: 135, g: 206, b: 235 },
      ) +
      rgb24(
        "   $$ |$$ |  $$ |$$ |  $$ |$$ |     $$  __$$ |$$ |  $$ |$$ |$$ |  $$ |$$  _$$<  $$   ____|$$ |  $$ |\n",
        { r: 255, g: 255, b: 224 },
      ) +
      rgb24(
        "   $$ |\\$$$$$$  |\\$$$$$$  |\\$$$$$$$\\\\$$$$$$$ |$$ |  $$ |$$ |\\$$$$$$  |$$ | \\$$\\ \\$$$$$$$\\ $$ |  $$ |\n",
        { r: 255, g: 215, b: 0 },
      ) +
      rgb24(
        "   \\__| \\______/  \\______/  \\_______|\\_______|\\__|  \\__|\\__| \\______/ \\__|  \\__| \\_______|\\__|  \\__|\n",
        { r: 255, g: 165, b: 0 },
      ),
  );

  console.log(
    `\tTrack blockchain events right from Discord by @${
      rgb24("AlexA", { r: 255, g: 0, b: 255 })
    }, @${rgb24("xRozzo", { r: 0, g: 255, b: 255 })} and @${
      rgb24("Jabolo", { r: 255, g: 215, b: 0 })
    }\n`,
  );
};
