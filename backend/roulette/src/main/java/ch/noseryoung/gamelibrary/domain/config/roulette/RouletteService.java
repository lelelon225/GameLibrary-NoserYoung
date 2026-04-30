package ch.noseryoung.gamelibrary.domain.config.roulette;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class RouletteService {
    public int spin() {
        RestTemplate restTemplate = new RestTemplate();
        int[] result = restTemplate.getForObject(
            "https://www.randomnumberapi.com/api/v1.0/random?min=0&max=37&count=1",
            int[].class
        );
        return result[0];
    }

}
