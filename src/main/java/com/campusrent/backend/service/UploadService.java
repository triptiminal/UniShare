package com.campusrent.backend.service;

import com.campusrent.backend.common.ApiException;
import com.campusrent.backend.common.Crypto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Cloudinary signed uploads: the browser uploads straight to Cloudinary using a short-lived signature
 * from this service, then sends the resulting URL back to our API (which validates it).
 */
@Service
public class UploadService {
    private static final List<String> FOLDERS = List.of("listings", "conditions", "verification", "profiles");

    @Value("${app.cloudinary.cloud-name}") private String cloudName;
    @Value("${app.cloudinary.api-key}") private String apiKey;
    @Value("${app.cloudinary.api-secret}") private String apiSecret;

    public Map<String, Object> sign(String folder) {
        if (!FOLDERS.contains(folder)) throw ApiException.badRequest("folder must be one of " + FOLDERS);
        long ts = Instant.now().getEpochSecond();
        String signature = Crypto.sha1Hex("folder=" + folder + "&timestamp=" + ts + apiSecret);
        return Map.<String, Object>of("cloudName", cloudName, "apiKey", apiKey, "timestamp", ts, "folder", folder,
                "signature", signature, "uploadUrl", "https://api.cloudinary.com/v1_1/" + cloudName + "/image/upload");
    }

    /** Only accept images hosted in our own Cloudinary account (skipped when cloud-name is blank in dev). */
    public void assertAllowedUrl(String url) {
        if (cloudName == null || cloudName.isBlank()) return;
        if (url == null || !url.startsWith("https://res.cloudinary.com/" + cloudName + "/"))
            throw ApiException.badRequest("Images must be uploaded through CampusRent");
    }
}
