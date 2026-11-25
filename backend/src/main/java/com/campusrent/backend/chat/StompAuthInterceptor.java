package com.campusrent.backend.chat;

import com.campusrent.backend.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;


@Component
@RequiredArgsConstructor
public class StompAuthInterceptor implements ChannelInterceptor {
    private final JwtDecoder decoder;
    private final JwtAuthenticationConverter converter;
    private final BookingRepository bookings;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor acc = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (acc == null) return message;
        if (StompCommand.CONNECT.equals(acc.getCommand())) {
            String h = acc.getFirstNativeHeader("Authorization");
            if (h == null || !h.startsWith("Bearer ")) throw new MessagingException("Missing bearer token");
            Jwt jwt = decoder.decode(h.substring(7));
            AbstractAuthenticationToken auth = converter.convert(jwt);
            acc.setUser(auth);
        } else if (StompCommand.SUBSCRIBE.equals(acc.getCommand())) {
            String dest = acc.getDestination();
            if (dest == null || !dest.startsWith("/topic/booking.")) throw new MessagingException("Unknown destination");
            Long userId = userId(acc.getUser());
            Long bookingId = Long.valueOf(dest.substring("/topic/booking.".length()));
            boolean ok = bookings.findById(bookingId)
                    .map(b -> b.getOwner().getId().equals(userId) || b.getRenter().getId().equals(userId)).orElse(false);
            if (!ok) throw new MessagingException("Not allowed to subscribe to this booking chat");
        }
        return message;
    }

    public static Long userId(java.security.Principal p) {
        if (p instanceof JwtAuthenticationToken t) return ((Number) t.getToken().getClaim("uid")).longValue();
        throw new MessagingException("Not authenticated");
    }
}
