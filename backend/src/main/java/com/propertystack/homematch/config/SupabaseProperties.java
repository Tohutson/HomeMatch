package com.propertystack.homematch.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.supabase")
public record SupabaseProperties(
        String url,
        String serviceRoleKey
) {
}
