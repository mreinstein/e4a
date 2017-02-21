# e4a

keep .env files synced from the command line

## installation

run this, replacing `<secret>` with your actual secret token:

```bash
npm i mreinstein/e4a -g
echo "API_TOKEN=<secret>" | sudo tee /usr/local/lib/node_modules/e4a/.env
```

Now you can use the service normally.


### link an environment file to sync

```bash
e4a link <filepath> <name>
```


### pull changes into a linked env file from remote

```bash
e4a pull <name>
```


### push changes from a linked env file to remote

```bash
e4a push <name>
```
