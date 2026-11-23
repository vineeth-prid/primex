# MinIO no longer publishes binaries or Docker images and its repository is archived (2026).
# This builds the final community release from source. See README "Object storage" for alternatives.
FROM golang:1.24-bookworm AS build
ARG MINIO_TAG=RELEASE.2025-10-15T17-29-55Z
RUN git clone --depth 1 --branch ${MINIO_TAG} https://github.com/minio/minio.git /src
WORKDIR /src
RUN CGO_ENABLED=0 go build -trimpath -ldflags "-s -w" -o /minio .

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl && rm -rf /var/lib/apt/lists/*
COPY --from=build /minio /usr/local/bin/minio
ENTRYPOINT ["minio"]
