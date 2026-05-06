package ch.noseryoung.gamelibrary.domain.config.roulette;


import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.GetMapping;


@Controller
@RequestMapping("/roulette")
public class RouletteController {
    @GetMapping("/test")
    public String getRunningMessage() {
        return new String("BackendRunning: ");
    }
    
    
}
