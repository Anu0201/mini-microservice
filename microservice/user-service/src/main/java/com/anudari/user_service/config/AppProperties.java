package com.anudari.user_service.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "app")
public class AppProperties {
    private String internalSecret;
    private Cloudinary cloudinary = new Cloudinary();

    @Getter
    @Setter
    public static class Cloudinary {
        private String cloudName;
        private String apiKey;
        private String apiSecret;
    }
}