package com.propertystack.homematch.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findBySupabaseUserId(String supabaseUserId);
}
