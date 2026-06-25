# syntax=docker/dockerfile:1
FROM eclipse-temurin:21-jdk-jammy AS build
WORKDIR /workspace
COPY gradlew settings.gradle build.gradle ./
COPY gradle gradle
COPY common common
COPY auth-service auth-service
COPY user-service/build.gradle  user-service/build.gradle
COPY payment-service/build.gradle  payment-service/build.gradle
COPY gateway-service/build.gradle  gateway-service/build.gradle
RUN --mount=type=cache,target=/root/.gradle,sharing=locked ./gradlew :auth-service:bootJar -x test --no-daemon

FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=build /workspace/auth-service/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]