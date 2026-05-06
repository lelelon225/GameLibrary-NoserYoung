package ch.noseryoung.gamelibrary.domain.config;

import ch.noseryoung.gamelibrary.domain.websocket.RouletteWebSocketHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final RouletteWebSocketHandler handler;

    public WebSocketConfig(RouletteWebSocketHandler handler) {
        this.handler = handler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(handler, "/ws/roulette")
            .setAllowedOrigins("*");
    }
}