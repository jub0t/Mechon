# Discord Bot Panel - DBP

Host and manage your discord bots from a web panel, deploy once use anywhere. Please read and follow the guide carefully to properly setup the panel.
We host our panel on [DigitalOcean](https://www.digitalocean.com/?refcode=bcc56aadc190&utm_campaign=Referral_Invite&utm_medium=Referral_Program&utm_source=badge), and so can you. You can signup from our url for a 100$ start-up credit<br>

[![DigitalOcean Referral Badge](https://web-platforms.sfo2.digitaloceanspaces.com/WWW/Badge%203.svg)](https://www.digitalocean.com/?refcode=5d09deecbc5d&utm_campaign=Referral_Invite&utm_medium=Referral_Program&utm_source=badge)

![Image](/preview.jpg)

## What's New?

- New & Better UI
- New stat charts & graphs
- Web-based terminal/shell added
- Updated `.env`, new setting options added
- License changed from `CC-BY-4.0` to `MIT`

## Installation

```shell
## Install PM2 Globally
npm i pm2 -g
## Install forever Globally
npm i forever -g
```

```shell
## Download Code
git clone https://github.com/jareer12/DiscordBotPanel.git
## Open the folder
cd DiscordBotPanel
## Install Required Modules
npm install
### Rename .env
mv .env.example .env
```

### Demo

[https://server.jubot.site/](https://server.jubot.site/create)

```env
Username: admin
Password: admin
```

### Env config

Once installation is done, you can change the `.env.example` file name to `.env` and configure it to your liking.

### Login System

By default the login system is disabled but you can enable it by changing `LOGIN_REQUIRED=false` to `LOGIN_REQUIRED=true` in your `.env` file. Credentials can be set from the env too.

### Final Setup

Once the installation and configuration is complete we can start our panel and run it. We'll be using `forever` to run the panel, the reason we'll use `forever` is that it can prevent downtime, so in case our panel runs into and error that it can not handle(which it most likely will), `forever` will re-start the panel by itself, preventing downtime.

```shell
## Open the folder
cd DiscordBotPanel
## Run the panel
forever start index.js
```

```shell
## This can also be used but is not recommended
cd DiscordBotPanel && node .
```

### Nginx Config

```nginx
server  {
    listen 80;
    server_name    server.jubot.site; ## Your Server

    location / {
        proxy_pass         http://localhost:2278; ### Replace "2278" With Your Port(If You Changed).
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host $host;
    }
}
```
