* teams
  * test auth flow (backend should create new team on new email, frontend should set currentTeam in config)
  * implement teams ls command
  * use currentTeam in /pull endpoint
  * use currentTeam in /push endpoint
  * implement add team command
  * implement switch command
  * implement invite member command

* add examples section to printed help
* list available env files from server
* locally unlink files
* remove env files from server
* `push` and `pull` commands should work with either file or `envName` as input
* per-command help (e.g., `envry help link`)
* lockable fields
* support multiple names in `push` and `pull` commands
* better colored syntax highlighting
* only push files that have changed since last push (deltas)


## lock the fields in a file so they don't change
```bash
envry lock <filepath> --field FIELD1 --field FIELD2
```

## sample invocation ideas

```bash
λ envry teams add boswell

"boswell" team created


λ envry teams invite boswell ted@barnettlabs.com

"ted@barnettlabs.com" invited to group "boswell"


λ envry teams ls

  id               email / name
✔ voiceco          voiceco
  nekoflux         reinstein.mike@gmail.com
  dreamingbits     Dreamingbits


λ envry link myproject/.env myproject-dev

"/Users/mikereinstein/myproject/.env" added with the name "myproject-dev"

```
