package ch.noseryoung.gamelibrary.domain.websocket;

import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.stereotype.Component;
import ch.noseryoung.gamelibrary.domain.config.roulette.RouletteService;

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