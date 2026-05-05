package com.enicarthage.incubator.config;

import com.enicarthage.incubator.service.LandingSectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class LandingSectionInitializer implements CommandLineRunner {

    private final LandingSectionService landingSectionService;

    @Override
    public void run(String... args) {
        landingSectionService.initDefaultSections();
    }
}
