# Build the extension using Docker. Assumes that execution contexts is
# in the root.

# using --output causes the build artifacts to instead be copied to ./.output
# on the host, rather than to an image
# see https://docs.docker.com/reference/cli/docker/buildx/build/#output
# Note that this requires BuildKit as the builder
docker build \
    --file ./docker/build.Dockerfile \
    --output type=local,dest=./.output \
    .