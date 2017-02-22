* user authentication
* command line help
* groups
* only push files that have changed since last push (deltas)
* ability to remove env files
* lockable fields
* `push` and `pull` commands should work with either file or `envName` as input
* support multiple names in `push` and `pull` commands


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


## lock the fields in a file so they don't change
```bash
e4a lock <filepath> --field FIELD1 --field FIELD2
```

## sample invocation ideas

```bash
λ e4a group add boswell

"boswell" group created

λ e4a group set boswell ted@barnettlabs.com

"ted@barnettlabs.com" added to group "boswell"

λ e4a link myproject/.env myproject-dev

"/Users/mikereinstein/myproject/.env" added with the name "myproject-dev"

```
