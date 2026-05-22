FROM ghcr.io/pnpm/pnpm:11.2.0@sha256:ec09bb114d1259572f21bc228b9da21a3a2faffb4d9565b042b116d7f2c4fe1d AS build

WORKDIR /build

COPY . .

RUN pnpm runtime set node 24.13.1 -g

# it's not actually used for the build, but it's still imported by
# the WXT config so just add it as nothing
RUN cat _config.example.ts > _config.ts

RUN pnpm install

RUN pnpm build:firefox --mv3
# builds chrome extension too
RUN pnpm build --mv3

FROM scratch AS export

COPY --from=build /build/.output /