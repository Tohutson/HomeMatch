package com.propertystack.homematch;

import com.propertystack.homematch.config.SecurityProperties;
import com.propertystack.homematch.config.SupabaseProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@EnableConfigurationProperties({SecurityProperties.class, SupabaseProperties.class})
public class HomematchApplication {

    public static void main(String[] args) {
        SpringApplication.run(HomematchApplication.class, args);
    }
}
