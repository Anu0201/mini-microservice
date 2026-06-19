# syntax=docker/dockerfile:1
FROM eclipse-temurin:17-jdk-jammy AS build
WORKDIR /workspace
COPY gradlew settings.gradle build.gradle ./
COPY gradle gradle
COPY common common
COPY gateway-service gateway-service
COPY auth-service auth-service
COPY user-service user-service
COPY payment-service payment-service
RUN --mount=type=cache,target=/root/.gradle,sharing=locked ./gradlew :gateway-service:bootJar -x test --no-daemon

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=build /workspace/gateway-service/build/libs/*.jar app.jar
EXPOSE 8060
ENTRYPOINT ["java", "-jar", "app.jar"]
