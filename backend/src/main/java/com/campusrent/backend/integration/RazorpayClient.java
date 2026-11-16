package com.campusrent.backend.integration;

import com.campusrent.backend.common.ApiException;
import com.campusrent.backend.common.Crypto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.Map;

/** Thin Razorpay REST wrapper (orders, refunds, signature checks). No SDK dependency. */
@Component
public class RazorpayClient {
    private final RestClient http;
    private final String keyId;
    private final String keySecret;
    private final String webhookSecret;

    public RazorpayClient(@Value("${app.razorpay.key-id}") String keyId,
                          @Value("${app.razorpay.key-secret}") String keySecret,
                          @Value("${app.razorpay.webhook-secret}") String webhookSecret) {
        this.keyId = keyId;
        this.keySecret = keySecret;
        this.webhookSecret = webhookSecret;
        this.http = RestClient.builder()
                .baseUrl("https://api.razorpay.com/v1")
                .defaultHeaders(h -> h.setBasicAuth(keyId, keySecret))
                .build();
    }

    public String getKeyId() { return keyId; }

    public Map<String, Object> createOrder(long paise, String receipt, Map<String, String> notes) {
        return post("/orders", Map.of("amount", paise, "currency", "INR", "receipt", receipt, "notes", notes));
    }

    public Map<String, Object> refund(String paymentId, long paise, Map<String, String> notes) {
        return post("/payments/" + paymentId + "/refund", Map.of("amount", paise, "notes", notes));
    }

    private Map<String, Object> post(String uri, Object body) {
        try {
            return http.post().uri(uri).contentType(MediaType.APPLICATION_JSON).body(body)
                    .retrieve().body(new ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (RestClientResponseException e) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Razorpay error: " + e.getResponseBodyAsString());
        }
    }

    /** Checkout success signature = HMAC_SHA256(order_id|payment_id, key_secret). */
    public boolean verifyCheckout(String orderId, String paymentId, String signature) {
        return Crypto.safeEquals(Crypto.hmacSha256Hex(keySecret, orderId + "|" + paymentId), signature);
    }

    /** Webhook signature = HMAC_SHA256(raw body, webhook_secret). */
    public boolean verifyWebhook(String rawBody, String signature) {
        return signature != null && Crypto.safeEquals(Crypto.hmacSha256Hex(webhookSecret, rawBody), signature);
    }
}
