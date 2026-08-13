ARG JAVA_VERSION=21
ARG SERVICE_NAME

FROM eclipse-temurin:${JAVA_VERSION}-jre-jammy
ARG SERVICE_NAME
ENV TZ=Asia/Ulaanbaatar
WORKDIR /app
COPY ${SERVICE_NAME}/build/libs/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]