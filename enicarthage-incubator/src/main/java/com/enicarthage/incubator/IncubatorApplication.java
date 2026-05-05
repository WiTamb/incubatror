package com.enicarthage.incubator;

import com.enicarthage.incubator.service.LandingSectionService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class IncubatorApplication {
    public static void main(String[] args) {
        SpringApplication.run(IncubatorApplication.class, args);
    }

}
