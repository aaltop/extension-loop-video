# create the file '_config.ts' in the root first before running this
# script. see '_config.example.ts'; it should suffice, for building,
# to 'cat _config.example.ts > _config.ts' in the root.
pnpm install
pnpm zip:firefox --mv3
pnpm zip --mv3