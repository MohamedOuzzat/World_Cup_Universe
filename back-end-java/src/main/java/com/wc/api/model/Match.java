package com.wc.api.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Entity
@Table(name = "matches")
public class Match {

    public enum Stage {
        GROUP, R16, QUARTER_FINAL, SEMI_FINAL, THIRD_PLACE, FINAL
    }

    public enum Status {
        SCHEDULED, LIVE, FINISHED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "home_team_id")
    @NotNull
    private Team homeTeam;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "away_team_id")
    @NotNull
    private Team awayTeam;

    @NotNull
    private LocalDateTime dateTime;

    @NotBlank
    private String groupName;

    @Enumerated(EnumType.STRING)
    @NotNull
    private Stage stage;

    private Integer homeScore;

    private Integer awayScore;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "stadium_id")
    private Stadium stadium;

    private Integer attendance;

    private String referee;

    @Enumerated(EnumType.STRING)
    @NotNull
    private Status status;

    public Match() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Team getHomeTeam() { return homeTeam; }
    public void setHomeTeam(Team homeTeam) { this.homeTeam = homeTeam; }
    public Team getAwayTeam() { return awayTeam; }
    public void setAwayTeam(Team awayTeam) { this.awayTeam = awayTeam; }
    public LocalDateTime getDateTime() { return dateTime; }
    public void setDateTime(LocalDateTime dateTime) { this.dateTime = dateTime; }
    public String getGroupName() { return groupName; }
    public void setGroupName(String groupName) { this.groupName = groupName; }
    public Stage getStage() { return stage; }
    public void setStage(Stage stage) { this.stage = stage; }
    public Integer getHomeScore() { return homeScore; }
    public void setHomeScore(Integer homeScore) { this.homeScore = homeScore; }
    public Integer getAwayScore() { return awayScore; }
    public void setAwayScore(Integer awayScore) { this.awayScore = awayScore; }
    public Stadium getStadium() { return stadium; }
    public void setStadium(Stadium stadium) { this.stadium = stadium; }
    public Integer getAttendance() { return attendance; }
    public void setAttendance(Integer attendance) { this.attendance = attendance; }
    public String getReferee() { return referee; }
    public void setReferee(String referee) { this.referee = referee; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
}
