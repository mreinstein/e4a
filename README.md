# envry

keep .env files synced from the command line

This is the command line client.


## installation

```bash
npm i mreinstein/envry -g
```


### link an environment file to sync

```bash
envry link <filepath> <name>
```


### pull changes into a linked env file from remote

```bash
envry pull <name>
```


### push changes from a linked env file to remote

```bash
envry push <name>
```
