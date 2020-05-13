# A `@resourcebot` for Slack

Let your teammates know when you're using shared resources (say, staging servers)
by adding a `@resourcebot` to your team's slack.

Your `@resourcebot` will respond to the following DM commands (you'll see the same
output when you DM the `help` command):

```
Command                   Description
-----------------------------------------------------------------------------
list                      List all resources
list available            List all resources which are currently available

add <name>                Add a resource with name <name>
remove <name>             Remove the resource with name <name>

claim <name> [duration]   Claim resource with name <name>
                          If [duration] is not applied, defaults to 1 hour.
                          Example durations are: "for 1 day", "until tonight"

release <name>            Release your claim on resource with name <name>
unclaim <name>            Release your claim on resource with name <name>
```

## A quick thanks to Botkit!

This code has been built on top of [Botkit](http://howdy.ai/botkit) ("Building
Blocks for Building Bots"). Thanks Botkit!

Botkit designed to ease the process of designing and running useful, creative or
just plain weird bots (and other types of applications) that live inside [Slack](http://slack.com)!

It provides a semantic interface to sending and receiving messages
so that developers can focus on creating novel applications and experiences
instead of dealing with API endpoints.

Botkit features a comprehensive set of tools
to deal with [Slack's integration platform](http://api.slack.com), and allows
developers to build both custom integrations for their
team, as well as public "Slack Button" applications that can be
run from a central location, and be used by many teams at the same time.

## Installation/Getting Started

1. Clone this repository

  ```sh
  git clone git@github.com:pariser/resourcebot.git
  ```

2. Set up a mongo database for your resourcebot to use.

3. In slack, if necessary, add a new bot.

  1. Go to Slack's "new bot" page: [https://my.slack.com/services/new/bot](https://my.slack.com/services/new/bot)

  2. When you click "Add Bot Integration", you are taken to a page where you can customize your bot's details. Choose a name (this README assumes you'll use the name `@resourcebot`). You can also add a fun avatar and description.

  3. Copy the API token that Slack gives you. You'll need it to configure your server...

4. Add a new file `.env` in the project root and add:

  <a name="dotenv" />
  ```
  SLACK_TOKEN=<REPLACE_THIS_WITH_YOUR_SLACK_API_TOKEN>
  MONGO_URI=<REPLACE_THIS_WITH_YOUR_MONGO_CONNECTION_URI>
  ```

5. Run the bot app:

  ```bash
  nodemon bot.js
  ```

  Your bot should be online! Open a DM with your bot and send it a message. Try `help` or `list`.

6. _NOTE_: Your bot has to be invited into a channel in order for it to listen for commands outside of a DM.

  To invite your bot into a new channel, switch to the target channel and type: `/invite @<my bot>`.

  After inviting the bot into this new channel, run a resourcebot command. Try `@resourcebot help` or `@resourcebot list`.

## Deployment and Monitoring

Capistrano has been configured to deploy `resourcebot` via git hooks from branch `master`. You should commit and push your changes to `master` before deploying.

For deployment, add a `.env` file on your server with the keys `SLACK_TOKEN` and `MONGO_URI`, just as you would have done above. I recommend adding two different bots (say `development-resourcebot` and `resourcebot`) with different keys.

### Deployment

```sh
cap production deploy
```

The `./bot.js` script which actually runs `resourcebot` will be launched and monitored by [`forever`](https://github.com/foreverjs/forever).

Other useful cap tasks are:

* `resourcebot:start`
* `resourcebot:stop`
* `resourcebot:restart`
* `resourcebot:status`
* `logs:tail`

The `forever` daemon process actually captures and routes the server logs. To find the log location from the server you can type `forever logs`.
