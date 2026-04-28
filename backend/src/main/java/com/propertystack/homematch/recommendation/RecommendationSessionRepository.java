package com.propertystack.homematch.recommendation;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface RecommendationSessionRepository extends JpaRepository<RecommendationSession, UUID> {

    Optional<RecommendationSession> findByIdAndUserId(UUID id, Long userId);
}
