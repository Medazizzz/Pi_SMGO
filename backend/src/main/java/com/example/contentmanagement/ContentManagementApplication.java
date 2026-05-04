package com.example.contentmanagement;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ContentManagementApplication {
    public static void main(String[] args) {
        SpringApplication.run(ContentManagementApplication.class, args);
    }
}
