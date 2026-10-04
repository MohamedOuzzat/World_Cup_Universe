package com.wc.api.repository;

import com.wc.api.model.Goal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GoalRepository extends JpaRepository<Goal, Long> {
    List<Goal> findByMatchIdOrderByMinute(Long matchId);
}
