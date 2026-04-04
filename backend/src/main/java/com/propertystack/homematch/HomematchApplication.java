package com.propertystack.homematch;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.retry.annotation.EnableRetry;

@SpringBootApplication
@EnableRetry
public class HomematchApplication {

    public static void main(String[] args) {
        SpringApplication.run(HomematchApplication.class, args);
    }
}
