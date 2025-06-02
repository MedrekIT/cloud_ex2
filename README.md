# A web application (with CI/CD pipeline) created for the second exercise in cloud computing programming.

Repository provides pipeline for web application built in the first exercise

> [!WARNING]
> Repository is mainly a copy of [this application](https://github.com/MedrekIT/cloud_ex2) but provides pipeline for it
> Source code is commented in Polish language

---

## Table of Contents

- [Screenshots](#screenshots)
- [Installation](#installation)
- [App usage](#usage)
- [CI/CD Pipeline](#pipeline)
    - [Tagging approach](#tagging)
    - [Steps](#steps)

---

## Screenshots

![Image building](./screenshots/build.png)

![Container running](./screenshots/run.png)

![Testing homepage](./screenshots/test_home.png)

![Testing weather infromation](./screenshots/test_weather.png)

![Healthcheck](./screenshots/healthcheck.png)

![Container logs](./screenshots/logs.png)

![Image layers info](./screenshots/layers.png)

---

## Installation

```bash
git clone https://github.com/MedrekIT/cloud_ex2.git
cd cloud_ex2
```

> [!IMPORTANT]
> You will need to provide your own API key from [OpenWeather page](https://openweathermap.org/api) to your [".env" file](./.env)

---

## Usage

*Build*
```bash
docker build -t weather-app .
```

*Run*
```bash
docker run -d -p 3000:3000 --env-file .env --name pogoda weather-app
```

*Test*
```bash
curl localhost:3000
```

*Get logs*
```bash
docker logs pogoda
```

*Get image layers info*
```bash
docker image inspect weather-app:latest --format='{{len .RootFS.Layers}} warstw, {{.Size}} bajtów'
```

---

## Pipeline

### Tagging

#### *Tagging container images:*

Images are automatically tagged by the `docker/metadata-action` according to the following schemes:
- `sha-<short-sha>`
- `v<semver>`

```yml
tags: |
    type=sha,priority=100,prefix=sha-,format=short
    type=semver,priority=200,pattern={{version}}   
```

**Reason:**
- `type=semver` allows tagging stable image versions in accordance with the [Semantic Versioning](https://semver.org) convention.
- `type=sha` ensures uniqueness and the ability to reproduce a specific repository state.

#### *Tagging cache:*

The cache uses a dedicated public repository on DockerHub named `${DOCKERHUB_USERNAME}/ghcr-cache:cache`

```yml
cache-from: |
    type=registry,ref=${{ vars.DOCKERHUB_USERNAME }}/ghcr-cache:cache
cache-to: |
    type=registry,ref=${{ vars.DOCKERHUB_USERNAME }}/ghcr-cache:cache,mode=max
```

**Reason:**
- `type=registry` enables sharing the cache across builds and machines, which increases the speed of subsequent builds – [BuildKit caching docs](https://docs.docker.com/build/cache/backends/registry/).

### Steps

1. Workflow triggered on demand and by pushing with tags matching `v*` pattern
```yml
on:
  workflow_dispatch:
  push:
    tags:
    - 'v*'
```

2. Fetching source code
```yml
- 
    name: Check out the source_repo
    uses: actions/checkout@v4
```

3. Generating image tags
```yml
-
    name: Docker metadata definitions
    id: meta
    uses: docker/metadata-action@v5
    with:
        images: ghcr.io/${{ github.repository }}
        flavor: latest=false
        tags: |
            type=sha,priority=100,prefix=sha-,format=short
            type=semver,priority=200,pattern={{version}}   
```

4. Build environment setup
- QEMU
```yml
- 
    name: QEMU set-up
    uses: docker/setup-qemu-action@v3
```
- Buildx
```yml
- 
    name: Buildx set-up
    uses: docker/setup-buildx-action@v3
```

5. Registry authentication
- GHCR
```yml
-
    name: Log in to GitHub Container Registry (GHCR)
    uses: docker/login-action@v3
    with:
        registry: ghcr.io
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
```
- DockerHub
```yml
-
    name: Login to DockerHub
    uses: docker/login-action@v3
    with:
        username: ${{ vars.DOCKERHUB_USERNAME }}
        password: ${{ secrets.DOCKERHUB_TOKEN }}
```

6. Building and caching
```yml
-
    name: Build Docker image
    uses: docker/build-push-action@v5
    with:
        context: .
        file: ./Dockerfile
        load: true
        push: false
        platforms: linux/amd64,linux/arm64
        cache-from: |
            type=registry,ref=${{ vars.DOCKERHUB_USERNAME }}/ghcr-cache:cache
        cache-to: |
            type=registry,ref=${{ vars.DOCKERHUB_USERNAME }}/ghcr-cache:cache,mode=max
        tags: ${{ steps.meta.outputs.tags }}
```

7. CVE scanning for vulnerabilities
```yml
-
    name: Scan Docker image for vulnerabilities
    uses: aquasecurity/trivy-action@0.30.0
    with:
        image-ref: ${{ steps.meta.outputs.tags }}
        format: table
        exit-code: 1
        severity: CRITICAL,HIGH
```

8. Publishing
```yml
-
    name: Push image to GHCR
    if: success()
    uses: docker/build-push-action@v5
    with:
        context: .
        file: ./Dockerfile
        push: true
        platforms: linux/amd64,linux/arm64
        cache-from: |
            type=registry,ref=${{ vars.DOCKERHUB_USERNAME }}/ghcr-cache:cache
        cache-to: |
            type=registry,ref=${{ vars.DOCKERHUB_USERNAME }}/ghcr-cache:cache,mode=max
        tags: ${{ steps.meta.outputs.tags }}
```
