# envry

keep .env files synced from the command line


## data structures

This is the current design which enables team support

`env_files` table:

```
{
  envName: "some name",
  id: "3425sadf132qdsad-adsfads-sdfadsasf",
  fields: { ... },
  teamid: "567342sdfwesreaw-34qr3wrqe-sfasdfas"
}
```


`teams` table:

```
{
  id: "567342sdfwesreaw-34qr3wrqe-sfasdfas",
  name: "voiceco",
  owner: "reinstein.mike@gmail.com",
  members: {
    "ted.barnett@gmail.com": {
      ...
    }
  }
}
```


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
