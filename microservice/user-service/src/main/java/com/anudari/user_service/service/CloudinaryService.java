package com.anudari.user_service.service;

import com.anudari.user_service.config.AppProperties;
import com.cloudinary.Cloudinary;
import com.cloudinary.Transformation;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CloudinaryService {

    private final AppProperties appProperties;

    private Cloudinary cloudinary() {
        AppProperties.Cloudinary cfg = appProperties.getCloudinary();
        return new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cfg.getCloudName(),
                "api_key", cfg.getApiKey(),
                "api_secret", cfg.getApiSecret()
        ));
    }

    public String uploadProfileImage(MultipartFile file, String username) throws IOException {
        Map<?, ?> result = cloudinary().uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                        "folder", "socialpay/profiles",
                        "public_id", "user_" + username,
                        "overwrite", true,
                        "transformation", new Transformation().width(400).height(400).crop("fill").gravity("face")
                )
        );
        return (String) result.get("secure_url");
    }
}