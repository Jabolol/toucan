# toucan

<img align="right" src="./assets/tokentoucan.png" style="border-radius: 10px;" height="150px" alt="a lunarpunk toucan" />

**Token Toucan**, the all in one XDC notification bot for Discord.

- Real-time event tracking for `XRC-21` and `XRC-721` contracts.
- Customizable contract `configuration` with real-time notifications.
- NFT `explorer` with metadata viewer.
- Blockchain data export to [`pastebin`](https://pastebin.com/).
- Informative event quantity `plots` for contract analysis.

## commands

The bot currently supports the following `commands`, future development is
planned:

#### follow

![](./assets/follow.png)

```bash
/follow [event] [address]
```

The `follow` command enables users to track events related to a specific address
within a Discord server. Notifications are sent in real-time to the channel
where the command was invoked.

#### unfollow

![](./assets/unfollow.png)

```bash
/unfollow [address]
```

The `unfollow` command removes real-time event tracking for a specific address
in the current Discord channel.

#### config event list

![](./assets/list.png)

```bash
/config event list
```

The `config event list` command lists all the addresses being tracked in the
current Discord channel, and the events that are being tracked for each address
by showing a legend of the event icons.

- <img src="https://cdn.discordapp.com/emojis/1126923308231827607.png" width="16" height="16">
  -> "transfer" event
- <img src="https://cdn.discordapp.com/emojis/1126937899972173944.png" width="16" height="16">
  -> "approval" event
- <img src="https://cdn.discordapp.com/emojis/1126923126803005572.png" width="16" height="16">
  -> "approval for all" event
- <img src="https://cdn.discordapp.com/emojis/1126923621714116658.png" width="16" height="16">
  -> all events

#### config event add

![](./assets/add.png)

```bash
/config event add [event] [address]
```

The `config event add` command adds new real-time event tracking for the
specified address in the current Discord channel.

> **Warning** You must already follow the address or else it won't work.

#### config event remove

![](./assets/remove.png)

```bash
/config event remove [event] [address]
```

The `config event remove` command removes real-time event tracking for the
specified address in the current Discord channel.

> **Warning** You must already follow the address or else it won't work.

#### plot

![](./assets/plot.png)

```bash
/plot [days] [type] [address]
```

The `plot` command generates a plot of the specified type for the specified
address in the current Discord channel. The plot is generated for the specified
number of days in retrospect.

> **Warning** You must choose the appropiate type for the address: `XRC-21` or
> `XRC-721`.

#### export

![](./assets/export.png)

```bash
/export [days] [address]
```

The `export` command exports the blockchain data for the specified address to
pastebin.

#### nft

![](./assets/nft.png)

```bash
/nft [token_id] [address]
```

The `nft` command displays the metadata for the specified token id and address
in the current Discord channel.

> **Warning** It must be a valid `XRC-721` address.

## notifications

Once an event is triggered, the bot will send a notification to the channel
where the command was invoked. The notification will contain the following
information:

![](./assets/notif.png)

## license

This project is licensed under the terms of the [MIT license](./LICENSE).
