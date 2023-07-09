/// <reference lib="deno.unstable" />

import "$std/dotenv/load.ts";
import { blue } from "$std/fmt/colors.ts";
import { serve } from "$std/http/server.ts";
import { type DiscordInteraction } from "discordeno";
import { json, respond, verifySignature } from "./misc.ts";
import { commands } from "./commands.ts";
import { chart } from "./utils.ts";
import { notify } from "../cron.ts";

serve(async (request) => {
  const url = new URL(request.url);

  if (url.pathname.indexOf("/chart") > -1) {
    return await chart(url);
  }
  if (url.pathname.indexOf("/notify") > -1) {
    await notify();
    return json({ message: "ok" });
  }
  if (request.method !== "POST") {
    return json({ error: "Invalid method" }, { status: 400 });
  }
  if (
    !["X-Signature-Ed25519", "X-Signature-Timestamp"].every((h) =>
      request.headers.get(h)
    )
  ) return json({ error: "Missing signature" }, { status: 400 });

  const { valid, body } = await verifySignature(request);

  if (!valid) {
    return json({ error: "Invalid signature" }, { status: 401 });
  }

  const interaction: DiscordInteraction = JSON.parse(body);

  switch (interaction.type) {
    case 1: {
      return json({ type: 1 });
    }
    case 2: {
      if (!interaction.data) {
        return respond({
          content: "Something went wrong, please try again!",
          flags: 1 << 6,
        });
      }
      return respond(await commands[interaction.data.name](interaction));
    }
    default: {
      return json({ error: "Bad request" }, { status: 400 });
    }
  }
}, {
  onListen: ({ hostname, port }) =>
    console.log(`${blue("::")} toucan listening at ${hostname}:${port}`),
});
