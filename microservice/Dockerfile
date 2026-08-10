# syntax=docker/dockerfile:1
ARG SERVICE_NAME

FROM eclipse-temurin:21-jdk-jammy AS build
ARG SERVICE_NAME
WORKDIR /workspace
COPY gradlew settings.gradle build.gradle ./
COPY gradle gradle
COPY common common
COPY auth-service/build.gradle    auth-service/build.gradle
COPY user-service/build.gradle    user-service/build.gradle
COPY payment-service/build.gradle payment-service/build.gradle
COPY gateway-service/build.gradle gateway-service/build.gradle
COPY ${SERVICE_NAME} ${SERVICE_NAME}
RUN --mount=type=cache,target=/root/.gradle,sharing=locked \
    ./gradlew :${SERVICE_NAME}:bootJar -x test --no-daemon

FROM eclipse-temurin:21-jre-jammy
ARG SERVICE_NAME
WORKDIR /app
COPY --from=build /workspace/${SERVICE_NAME}/build/libs/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]