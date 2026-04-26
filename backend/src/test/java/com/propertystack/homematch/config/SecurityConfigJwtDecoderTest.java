package com.propertystack.homematch.config;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JOSEObjectType;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.gen.RSAKeyGenerator;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.JwtClaimValidator;
import org.springframework.security.oauth2.jwt.JwtValidationException;

import java.text.ParseException;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SecurityConfigJwtDecoderTest {

    private static final String ISSUER = "https://example.supabase.co/auth/v1";

    @Test
    void shouldRejectTokenWithInvalidIssuer() throws Exception {
        RSAKey rsaKey = rsaKey();
        JwtDecoder jwtDecoder = decoder(rsaKey);
        String token = signedToken(rsaKey, "http://invalid-issuer/auth/v1", "authenticated", Instant.now().plusSeconds(60));

        assertThatThrownBy(() -> jwtDecoder.decode(token))
                .isInstanceOf(JwtValidationException.class);
    }

    @Test
    void shouldRejectTokenWithInvalidAudience() throws Exception {
        RSAKey rsaKey = rsaKey();
        JwtDecoder jwtDecoder = decoder(rsaKey);
        String token = signedToken(rsaKey, ISSUER, "wrong-audience", Instant.now().plusSeconds(60));

        assertThatThrownBy(() -> jwtDecoder.decode(token))
                .isInstanceOf(JwtValidationException.class);
    }

    @Test
    void shouldRejectExpiredToken() throws Exception {
        RSAKey rsaKey = rsaKey();
        JwtDecoder jwtDecoder = decoder(rsaKey);
        String token = signedToken(rsaKey, ISSUER, "authenticated", Instant.now().minusSeconds(60));

        assertThatThrownBy(() -> jwtDecoder.decode(token))
                .isInstanceOf(JwtValidationException.class);
    }

    private JwtDecoder decoder(RSAKey rsaKey) throws JOSEException {
        NimbusJwtDecoder jwtDecoder = NimbusJwtDecoder.withPublicKey(rsaKey.toRSAPublicKey())
                .signatureAlgorithm(org.springframework.security.oauth2.jose.jws.SignatureAlgorithm.RS256)
                .build();
        OAuth2TokenValidator<org.springframework.security.oauth2.jwt.Jwt> withIssuer =
                JwtValidators.createDefaultWithIssuer(ISSUER);
        OAuth2TokenValidator<org.springframework.security.oauth2.jwt.Jwt> withAudience =
                new JwtClaimValidator<>("aud", claim -> {
                    if (claim instanceof String claimValue) {
                        return "authenticated".equals(claimValue);
                    }

                    if (claim instanceof java.util.Collection<?> claimValues) {
                        return claimValues.stream().anyMatch("authenticated"::equals);
                    }

                    return false;
                });
        jwtDecoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(withIssuer, withAudience));
        return jwtDecoder;
    }

    private String signedToken(RSAKey rsaKey, String issuer, String audience, Instant expiresAt)
            throws JOSEException, ParseException {
        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                .subject("supabase-user-1")
                .issuer(issuer)
                .audience(audience)
                .issueTime(java.util.Date.from(expiresAt.minusSeconds(60)))
                .expirationTime(java.util.Date.from(expiresAt))
                .claim("email", "test@example.com")
                .build();

        SignedJWT jwt = new SignedJWT(
                new JWSHeader.Builder(JWSAlgorithm.RS256)
                        .keyID(rsaKey.getKeyID())
                        .type(JOSEObjectType.JWT)
                        .build(),
                claimsSet
        );
        jwt.sign(new RSASSASigner(rsaKey.toPrivateKey()));
        return jwt.serialize();
    }

    private RSAKey rsaKey() throws JOSEException {
        return new RSAKeyGenerator(2048)
                .algorithm(JWSAlgorithm.RS256)
                .keyID("test-key")
                .generate();
    }
}
