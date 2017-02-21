# e4a

keep .env files synced from the command line

## installation

run this, replacing `<secret>` with your actual secret token:

```bash
npm i mreinstein/e4a -g
echo "API_TOKEN=<secret>" | sudo tee /usr/local/lib/node_modules/e4a/.env
```


## cli

The first time you interact with the service, it authenticates you:
```bash
λ e4a
> Enter your email: reinstein.mike@gmail.com
> Please follow the link sent to reinstein.mike@gmail.com to log in.
> Verify that the provided security code in the email matches Gentle Frigatebird.

⠦ Waiting for confirmation...
```

after following the email link, you see this in the console:
```
✔ Confirmed email address!
```


This creates a `~/.e4a.json` file which contains something like this:

```javascript
{
  "email": "reinstein.mike@gmail.com",
  "token": "somesecret token goes here"
}
```

Now you can use the service normally.


```bash
λ e4a group add boswell

"boswell" group created

λ e4a group set boswell ted@barnettlabs.com

"ted@barnettlabs.com" added to group "boswell"

λ e4a link myproject/.env myproject-dev

"/Users/mikereinstein/myproject/.env" added with the name "myproject-dev"

```


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


### lock the fields in a file so they don't change
```bash
e4a lock <filepath> --field FIELD1 --field FIELD2
```


## server endpoints

### POST /auth  email, token
  
  sends an email to the person to verify identity


### GET /auth/verify?token=...

  mark the token as verified. add it to the database
  if the account doesn't exist, create it


### GET /auth/status?token=...
  get the current status of the token


### POST /link
  link an environment file

### POST /sync
  send deltas of all linked files to the service,
  merges changes, sends deltas back to client


## server side data structures

```
groups
------
{
  groupname: string,
  email: string,
  isAdmin: bool
}


files
------
{
  id: string,
  email: string,
  groupname: string,
  filename: string,
  fields: {
    "SOME_FIELD": "SOME_VALUE",
    "SOME_OTHER_FIELD": "SOME_OTHER_VALUE"
  }
}
```
