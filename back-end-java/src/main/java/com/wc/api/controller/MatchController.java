package com.wc.api.controller;

import com.wc.api.model.Goal;
import com.wc.api.model.Match;
import com.wc.api.service.MatchService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/matches")
public class MatchController {

    private final MatchService matchService;

    public MatchController(MatchService matchService) {
        this.matchService = matchService;
    }

    @GetMapping
    public List<Match> getAllMatches() {
        return matchService.getAllMatches();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Match> getMatchById(@PathVariable Long id) {
        Match match = matchService.getMatchById(id);
        if (match == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(match);
    }

    @GetMapping("/by-stage")
    public List<Match> getMatchesByStage(@RequestParam Match.Stage stage) {
        return matchService.getMatchesByStage(stage);
    }

    @GetMapping("/by-group")
    public List<Match> getMatchesByGroup(@RequestParam String group) {
        return matchService.getMatchesByGroup(group);
    }

    @GetMapping("/by-status")
    public List<Match> getMatchesByStatus(@RequestParam Match.Status status) {
        return matchService.getMatchesByStatus(status);
    }

    @GetMapping("/{id}/goals")
    public ResponseEntity<List<Goal>> getMatchGoals(@PathVariable Long id) {
        if (matchService.getMatchById(id) == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(matchService.getMatchGoals(id));
    }
}
