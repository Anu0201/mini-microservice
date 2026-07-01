# syntax=docker/dockerfile:1
FROM eclipse-temurin:21-jdk-jammy AS build
WORKDIR /workspace
COPY gradlew settings.gradle build.gradle ./
COPY gradle gradle
COPY common common
COPY user-service user-service
COPY auth-service/build.gradle  auth-service/build.gradle
COPY payment-service/build.gradle  payment-service/build.gradle
COPY gateway-service/build.gradle  gateway-service/build.gradle
RUN --mount=type=cache,target=/root/.gradle,sharing=locked ./gradlew clean :user-service:bootJar -x test --no-daemon

FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=build /workspace/user-service/build/libs/*.jar app.jar
EXPOSE 8082
ENTRYPOINT ["java", "-jar", "app.jar"]
