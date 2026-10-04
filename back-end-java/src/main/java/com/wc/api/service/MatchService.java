package com.wc.api.service;

import com.wc.api.model.Goal;
import com.wc.api.model.Match;
import com.wc.api.repository.GoalRepository;
import com.wc.api.repository.MatchRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MatchService {

    private final MatchRepository matchRepository;
    private final GoalRepository goalRepository;

    public MatchService(MatchRepository matchRepository, GoalRepository goalRepository) {
        this.matchRepository = matchRepository;
        this.goalRepository = goalRepository;
    }

    public List<Match> getAllMatches() {
        return matchRepository.findAllByOrderByDateTime();
    }

    public Match getMatchById(Long id) {
        return matchRepository.findById(id).orElse(null);
    }

    public List<Match> getMatchesByStage(Match.Stage stage) {
        return matchRepository.findByStageOrderByDateTime(stage);
    }

    public List<Match> getMatchesByGroup(String groupName) {
        return matchRepository.findByGroupNameOrderByDateTime(groupName);
    }

    public List<Match> getMatchesByStatus(Match.Status status) {
        return matchRepository.findByStatusOrderByDateTime(status);
    }

    public List<Goal> getMatchGoals(Long matchId) {
        return goalRepository.findByMatchIdOrderByMinute(matchId);
    }
}
