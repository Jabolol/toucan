import "$std/dotenv/load.ts";

export const commands = [
  {
    name: "hello",
    description: "Say hello to someone",
    options: [{
      name: "name",
      description: "The name of the person",
      type: 3,
      required: true,
    }],
  },
  {
    name: "follow",
    description: "Follow events for any smart contract on the XDC chain",
    options: [{
      name: "event",
      description: "The events to follow",
      type: 3,
      required: true,
      choices: [{
        name: "transfer",
        value: "0",
      }, {
        name: "approval",
        value: "1",
      }, {
        name: "approval_for_all",
        value: "2",
      }, {
        name: "all",
        value: "3",
      }],
    }, {
      name: "address",
      description: "The address of the smart contract",
      type: 3,
      required: true,
      min_length: 43,
      max_length: 43,
    }],
    dm_permission: false,
  },
  {
    name: "unfollow",
    description: "Unfollow events for any smart contract on the XDC chain",
    options: [{
      name: "address",
      description: "The address of the smart contract",
      type: 3,
      required: true,
      min_length: 43,
      max_length: 43,
    }],
    dm_permission: false,
  },
  {
    name: "config",
    description: "Configuration related commands",
    options: [
      {
        type: 2,
        name: "events",
        description: "Configure the received smart contract events",
        options: [
          {
            type: 1,
            name: "list",
            description: "Show the configuration for the current guild",
            options: [],
          },
          {
            type: 1,
            name: "add",
            description: "Add an event",
            options: [{
              name: "event",
              description: "The event to add",
              type: 3,
              required: true,
              choices: [{
                name: "transfer",
                value: "0",
              }, {
                name: "approval",
                value: "1",
              }, {
                name: "approval_for_all",
                value: "2",
              }, {
                name: "all",
                value: "3",
              }],
            }, {
              name: "address",
              description: "The address of the smart contract",
              type: 3,
              required: true,
              min_length: 43,
              max_length: 43,
            }],
          },
          {
            type: 1,
            name: "remove",
            description: "Remove an event",
            options: [{
              name: "event",
              description: "The event to remove",
              type: 3,
              required: true,
              choices: [{
                name: "transfer",
                value: "0",
              }, {
                name: "approval",
                value: "1",
              }, {
                name: "approval_for_all",
                value: "2",
              }, {
                name: "all",
                value: "3",
              }],
            }, {
              name: "address",
              description: "The address of the smart contract",
              type: 3,
              required: true,
              min_length: 43,
              max_length: 43,
            }],
          },
          {
            name: "plot",
            description: "Get information about a contract in a plot",
            options: [{
              name: "days",
              description: "The dataset period duration in days",
              type: 4,
              required: true,
            }, {
              name: "type",
              description: "The contract type",
              choices: [{
                name: "xrc_20",
                value: "0",
              }, {
                name: "xrc_721",
                value: "1",
              }],
              required: true,
            }, {
              name: "address",
              description: "The address of the smart contract",
              type: 3,
              required: true,
              min_length: 43,
              max_length: 43,
            }],
            dm_permission: false,
          },
        ],
      },
    ],
  },
];

const URL = `https://discord.com/api/v10/applications/${
  Deno.env.get("APPLICATION_ID")
}/commands`;

const req = await fetch(URL, {
  headers: {
    "Authorization": `Bot ${Deno.env.get("DISCORD_TOKEN")}`,
    "Content-Type": "application/json",
  },
  method: "put",
  body: JSON.stringify(commands),
});

const data = await req.json();

console.log(data["errors"]);
