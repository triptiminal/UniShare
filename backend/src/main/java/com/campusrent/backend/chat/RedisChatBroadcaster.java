package com.campusrent.backend.chat;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;

import java.nio.charset.StandardCharsets;


@Configuration
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.chat.redis-enabled", havingValue = "true")
public class RedisChatBroadcaster {
    static final String CHANNEL = "campusrent:chat";
    private final ChatDelivery delivery;

    @Bean
    ChatBroadcaster redisBroadcaster(StringRedisTemplate redis) {
        return id -> redis.convertAndSend(CHANNEL, String.valueOf(id));
    }

    @Bean
    RedisMessageListenerContainer chatListenerContainer(RedisConnectionFactory cf) {
        RedisMessageListenerContainer c = new RedisMessageListenerContainer();
        c.setConnectionFactory(cf);
        c.addMessageListener((message, pattern) ->
                delivery.deliver(Long.valueOf(new String(message.getBody(), StandardCharsets.UTF_8))), new ChannelTopic(CHANNEL));
        return c;
    }
}
