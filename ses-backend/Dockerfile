# syntax=docker/dockerfile:1.7
#
# Multi-stage build for the ses-backend Spring Boot service.
#   - Build stage: JDK 21 + Gradle wrapper -> produces an executable boot jar.
#   - Runtime stage: slim JRE 21, runs as a non-root user.
#
# Build:   docker build -t ses-backend ./ses-backend
# Run:     docker run --rm -p 8080:8080 \
#            -e SPRING_DATASOURCE_URL=jdbc:postgresql://host.docker.internal:5432/eventsphere \
#            -e SPRING_DATASOURCE_USERNAME=postgres \
#            -e SPRING_DATASOURCE_PASSWORD=postgres \
#            -e APP_JWT_SECRET="$(openssl rand -base64 48)" \
#            ses-backend

# ---- Build stage --------------------------------------------------------
FROM eclipse-temurin:21-jdk-jammy AS build
WORKDIR /workspace

# Copy wrapper + build descriptors first so dependency resolution is cached
# independently of source changes.
COPY gradlew settings.gradle build.gradle ./
COPY gradle ./gradle
RUN chmod +x gradlew

# Warm Gradle's dependency cache. Failures here are non-fatal: the real build
# below will resolve anything that's missing.
RUN --mount=type=cache,target=/root/.gradle \
    ./gradlew --no-daemon dependencies > /dev/null 2>&1 || true

# Copy sources and produce the bootable jar. Tests are skipped here; run them
# in CI before building the image.
COPY src ./src
RUN --mount=type=cache,target=/root/.gradle \
    ./gradlew --no-daemon clean bootJar -x test \
 && cp build/libs/*-SNAPSHOT.jar app.jar

# ---- Runtime stage ------------------------------------------------------
FROM eclipse-temurin:21-jre-jammy AS runtime
WORKDIR /app

# Drop privileges.
RUN groupadd --system --gid 1001 spring \
 && useradd  --system --uid 1001 --gid spring --home /app spring

COPY --from=build --chown=spring:spring /workspace/app.jar /app/app.jar

USER spring
EXPOSE 8080

# Honour JAVA_OPTS so callers can tune heap / GC without rebuilding.
ENV JAVA_OPTS=""
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
