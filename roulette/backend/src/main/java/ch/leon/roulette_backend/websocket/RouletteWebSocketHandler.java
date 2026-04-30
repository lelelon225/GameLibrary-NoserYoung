package ch.leon.roulette_backend.websocket;

import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.stereotype.Component;
import ch.leon.roulette_backend.roulette_backend.roulette.RouletteService;

@Component
public class RouletteWebSocketHandler extends TextWebSocketHandler {

    private final RouletteService rouletteService;

    public RouletteWebSocketHandler(RouletteService rouletteService) {
        this.rouletteService = rouletteService;
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        int result = rouletteService.spin();
        session.sendMessage(new TextMessage(String.valueOf(result)));
    }
}