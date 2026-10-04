package com.wc.api.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

@Entity
@Table(name = "goals")
public class Goal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_id")
    @NotNull
    private Match match;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "team_id")
    @NotNull
    private Team team;

    @NotBlank
    private String scorer;

    @PositiveOrZero
    @Column(name = "goal_minute")
    private int minute;

    private boolean ownGoal;

    private boolean penalty;

    public Goal() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Match getMatch() { return match; }
    public void setMatch(Match match) { this.match = match; }
    public Team getTeam() { return team; }
    public void setTeam(Team team) { this.team = team; }
    public String getScorer() { return scorer; }
    public void setScorer(String scorer) { this.scorer = scorer; }
    public int getMinute() { return minute; }
    public void setMinute(int minute) { this.minute = minute; }
    public boolean isOwnGoal() { return ownGoal; }
    public void setOwnGoal(boolean ownGoal) { this.ownGoal = ownGoal; }
    public boolean isPenalty() { return penalty; }
    public void setPenalty(boolean penalty) { this.penalty = penalty; }
}
