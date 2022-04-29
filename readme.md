# Discord Bot Panel - DBP

Host and manage & host your discord bots from a web panel, deploy once use anywhere. Please read and follow the guide carefuly to properly setup the panel.

![Image](/preview.svg)

## What's New?

- New & Better UI
- New stat charts & graphs
- Web-base terminal/shell added
- Updated `.env`, new setting options added
- License changed from `CC-BY-4.0` to `MIT`

## Installation

```shell
## Install PM2 Globaly
npm i pm2 -g
```

```shell
## Downlaod Code
git clone https://github.com/jareer12/DiscordBotPanel.git
## Open the folder
cd /path/to/panel
## Install Required Modules
npm install
```

### Env config

Once installation is done, you can change the `.env.example` file name to `.env` and configure it to your liking.

### Login System

By default the login system is disabled but you can enable it by changing `LOGIN_REQUIRED=false` to `LOGIN_REQUIRED=true` in your `.env` file. Credentials can be set from the env too.

### Final Setup

Once the installation and configuration is complete we can start our panel and run it. We'll be using `forever` to run the panel, the reason we'll use `forever` is that `forever` can prevent downtime, so in case our panel runs into and error that it can not handle(which it most likely will), `forever` will re-start the panel by itself, preventing downtime.

```shell
## Open the folder
cd /path/to/panel
## Run the panel
foever start index.js
```

```shell
## This can also be used but is not recommended
cd /path/to/panel && node .
```

### Manual File Interaction

If you don't want to use the built-in file manager you can always upload your code to `/bots` directory.
