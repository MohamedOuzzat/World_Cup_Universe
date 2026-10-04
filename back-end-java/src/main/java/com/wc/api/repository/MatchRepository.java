package com.wc.api.repository;

import com.wc.api.model.Match;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MatchRepository extends JpaRepository<Match, Long> {
    List<Match> findByStageOrderByDateTime(Match.Stage stage);
    List<Match> findByGroupNameOrderByDateTime(String groupName);
    List<Match> findByStatusOrderByDateTime(Match.Status status);
    List<Match> findAllByOrderByDateTime();
}
