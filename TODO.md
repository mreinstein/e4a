* teams
* ability to remove env files
* lockable fields
* `push` and `pull` commands should work with either file or `envName` as input
* support multiple names in `push` and `pull` commands
* better colored syntax highlighting
* only push files that have changed since last push (deltas)
* look into replacing `minimist` with `mri` (smaller and lighter)


## lock the fields in a file so they don't change
```bash
envry lock <filepath> --field FIELD1 --field FIELD2
```

## sample invocation ideas

```bash
λ envry group add boswell

"boswell" group created

λ envry group set boswell ted@barnettlabs.com

"ted@barnettlabs.com" added to group "boswell"

λ envry link myproject/.env myproject-dev

"/Users/mikereinstein/myproject/.env" added with the name "myproject-dev"

```
